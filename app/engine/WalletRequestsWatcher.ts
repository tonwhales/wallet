import EventEmitter from "events";
import { exponentialBackoffDelay } from "teslabot";
import { createLogger } from "../utils/log";
import { Address } from '@ton/core';

const MESSAGE_TIMEOUT = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Wallet request types based on the server implementation
export type WalletRequest = {
    requestId: string;
    requestor: string;
    confirmant: string;
    status: 'pending' | 'confirmed' | 'declined' | 'expired';
    message?: string;
    created: string;
    expiresAt?: string;
    metadata?: any;
};

export type WalletRequestEvent = {
    type: 'new_request' | 'request_response' | 'expired';
    request: WalletRequest;
};

export type WalletRequestNotification = {
    event: 'connected' | 'notification' | 'pending_requests' | 'heartbeat' | 'pong' | 'error';
    data: any;
};

export interface WalletRequestsWatcher {
    emit(event: 'connected', data: { walletAddress: string; timestamp: string }): boolean
    on(event: 'connected', listener: (data: { walletAddress: string; timestamp: string }) => void): this
    once(event: 'connected', listener: (data: { walletAddress: string; timestamp: string }) => void): this

    emit(event: 'notification', data: WalletRequestEvent): boolean
    on(event: 'notification', listener: (data: WalletRequestEvent) => void): this
    once(event: 'notification', listener: (data: WalletRequestEvent) => void): this

    emit(event: 'pending_requests', data: { requests: WalletRequest[] }): boolean
    on(event: 'pending_requests', listener: (data: { requests: WalletRequest[] }) => void): this
    once(event: 'pending_requests', listener: (data: { requests: WalletRequest[] }) => void): this

    emit(event: 'error', data: { message: string; type?: string; originalError?: any }): boolean
    on(event: 'error', listener: (data: { message: string; type?: string; originalError?: any }) => void): this
    once(event: 'error', listener: (data: { message: string; type?: string; originalError?: any }) => void): this

    emit(event: 'disconnected'): boolean
    on(event: 'disconnected', listener: () => void): this
    once(event: 'disconnected', listener: () => void): this
}

const logger = createLogger('wallet-requests');

export class WalletRequestsWatcher extends EventEmitter {
    readonly endpoint: string;
    readonly walletAddress: string;
    readonly walletAddressNormalized: string;
    readonly protocol: string;
    readonly isTestnet: boolean;

    #ws: WebSocket | null = null;
    #wsTimer: any | null = null;
    #heartbeatTimer: any | null = null;
    #wsFailures = 0;
    #wsConnected = false;
    #stopped = false;
    #connectingLock: (() => void) | null = null;

    constructor(endpoint: string, walletAddress: string, protocol: string = 'wss', isTestnet: boolean) {
        super();
        this.endpoint = endpoint;
        this.walletAddress = walletAddress;
        this.protocol = protocol;
        this.isTestnet = isTestnet;

        // Normalize wallet address
        try {
            const addr = Address.parse(walletAddress);
            this.walletAddressNormalized = addr.toString({ bounceable: false, testOnly: isTestnet });
        } catch (e) {
            throw new Error(`Invalid wallet address format: ${walletAddress}`);
        }

        this.#start();
    }

    get isConnected() {
        return this.#wsConnected;
    }

    get normalizedAddress() {
        return this.walletAddressNormalized;
    }

    #start() {
        if (this.#stopped) {
            return;
        }

        logger.log(`Connecting to wallet requests for: ${this.walletAddressNormalized}`);

        this.#close();

        // Create websocket connection
        const wsUrl = `${this.protocol}://${this.endpoint}/wallet-request/${encodeURIComponent(this.walletAddressNormalized)}/${this.isTestnet ? 'testnet' : 'mainnet'}/watch/ws`;
        let nws = new WebSocket(wsUrl);

        nws.onopen = () => {
            if (this.#ws === nws) {
                logger.log(`Connected to wallet requests for: ${this.walletAddressNormalized}`);
                this.#wsConnected = true;
                this.#wsFailures = 0;

                // Start heartbeat
                this.#startHeartbeat();

                // Start message watchdog
                this.#startMessageWatchdog();
            }
        };

        nws.onclose = (ev) => {
            if (this.#ws === nws) {
                logger.log(`WebSocket closed for wallet: ${this.walletAddressNormalized}, code: ${ev.code}`);

                this.#wsConnected = false;
                this.#stopHeartbeat();

                this.emit('disconnected');

                // Reconnect if connection was established before
                if (this.#wsConnected) {
                    logger.warn('Connection lost: reconnecting immediately');
                    this.#wsFailures = 0;
                    this.#start();
                } else {
                    this.#reconnectOnFailure();
                }
            }
        };

        nws.onmessage = (ev) => {
            if (this.#ws !== nws) {
                return;
            }

            if (typeof ev.data !== 'string') {
                return;
            }

            let parsed: WalletRequestNotification;
            try {
                parsed = JSON.parse(ev.data);
            } catch (e) {
                logger.warn(`Failed to parse message: ${e}`);
                return;
            }

            // Reset WS failures counter
            this.#wsFailures = 0;
            this.#wsConnected = true;

            // Handle different event types
            switch (parsed.event) {
                case 'connected':
                    logger.log(`Session established for wallet: ${this.walletAddressNormalized}`);
                    this.emit('connected', parsed.data);
                    break;

                case 'notification':
                    logger.log(`Received notification for wallet: ${this.walletAddressNormalized}`);
                    this.emit('notification', parsed.data);
                    break;

                case 'pending_requests':
                    logger.log(`Received ${parsed.data.requests?.length || 0} pending requests`);
                    this.emit('pending_requests', parsed.data);
                    break;

                case 'heartbeat':
                    // Heartbeat received, connection is alive
                    break;

                case 'pong':
                    // Pong received in response to our ping
                    break;

                case 'error':
                    logger.warn(`Server error: ${parsed.data.message}`);
                    this.emit('error', parsed.data);
                    break;

                default:
                    logger.warn(`Unknown event type: ${parsed.event}`);
            }

            // Release connection lock
            if (this.#connectingLock) {
                this.#connectingLock();
                this.#connectingLock = null;
            }

            // Restart message watchdog
            this.#startMessageWatchdog();
        };

        nws.onerror = (error) => {
            if (this.#ws === nws) {
                const errorMessage = JSON.stringify(error);
                logger.warn(`WebSocket error for wallet ${this.walletAddressNormalized}: ${errorMessage}`);

                // Check for certificate-related errors (OSStatus -9847 and similar)
                if (errorMessage.includes('OSStatus error -9847') ||
                    errorMessage.includes('certificate') ||
                    errorMessage.includes('SSL') ||
                    errorMessage.includes('TLS')) {

                    logger.warn('Certificate validation error detected. This may be due to:');
                    logger.warn('- Self-signed certificates on development server');
                    logger.warn('- Invalid certificate chain');
                    logger.warn('- Protocol mismatch (trying wss:// with HTTP server)');

                    // Emit a specific error for certificate issues
                    this.emit('error', {
                        message: 'Certificate validation failed. Check server SSL configuration.',
                        type: 'certificate_error',
                        originalError: error
                    });
                } else {
                    // Emit generic error
                    this.emit('error', {
                        message: 'WebSocket connection error',
                        type: 'connection_error',
                        originalError: error
                    });
                }
            }
        };

        this.#ws = nws;

        // Connection timeout
        this.#wsTimer = setTimeout(() => {
            if (this.#ws === nws && !this.#wsConnected) {
                logger.warn('Connection timeout');
                this.#reconnectOnFailure();
            }
        }, CONNECTION_TIMEOUT);
    }

    #reconnectOnFailure() {
        // Increase failure count and calculate delay
        this.#wsFailures = Math.min(this.#wsFailures + 1, 10);
        let delay = exponentialBackoffDelay(this.#wsFailures, 1000, 30000, 10);

        logger.warn(`Connection attempt failed. Reconnecting in ${delay} ms (attempt ${this.#wsFailures})`);

        this.#close();

        // Schedule reconnection
        this.#wsTimer = setTimeout(() => {
            if (!this.#stopped) {
                this.#start();
            }
        }, delay);
    }

    #startMessageWatchdog() {
        // Clear existing timer
        if (this.#wsTimer) {
            clearTimeout(this.#wsTimer);
            this.#wsTimer = null;
        }

        // Start new timeout
        this.#wsTimer = setTimeout(() => {
            if (!this.#stopped) {
                logger.warn('Message timeout: restarting connection');
                this.#start();
            }
        }, MESSAGE_TIMEOUT);
    }

    #startHeartbeat() {
        this.#stopHeartbeat();

        this.#heartbeatTimer = setInterval(() => {
            if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
                try {
                    this.#ws.send(JSON.stringify({
                        type: 'ping'
                    }));
                } catch (e) {
                    logger.warn(`Failed to send ping: ${e}`);
                    this.#start(); // Restart connection
                }
            }
        }, HEARTBEAT_INTERVAL);
    }

    #stopHeartbeat() {
        if (this.#heartbeatTimer) {
            clearInterval(this.#heartbeatTimer);
            this.#heartbeatTimer = null;
        }
    }

    #close() {
        // Clear timers
        if (this.#wsTimer) {
            clearTimeout(this.#wsTimer);
            this.#wsTimer = null;
        }

        this.#stopHeartbeat();

        // Close websocket
        if (this.#ws) {
            let w = this.#ws;
            this.#ws = null;
            try {
                w.close();
            } catch (e) {
                // Ignore close errors
            }
        }

        this.#wsConnected = false;
    }

    // Send unsubscribe message to server
    unsubscribe() {
        if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
            try {
                this.#ws.send(JSON.stringify({
                    type: 'unsubscribe'
                }));
            } catch (e) {
                logger.warn(`Failed to send unsubscribe: ${e}`);
            }
        }
    }

    // Stop the watcher completely
    stop() {
        if (this.#stopped) {
            return;
        }

        logger.log(`Stopping wallet requests watcher for: ${this.walletAddressNormalized}`);

        this.#stopped = true;

        // Send unsubscribe before closing
        this.unsubscribe();

        // Close connection
        this.#close();

        // Emit disconnected event
        this.emit('disconnected');
    }

    // Restart the watcher (useful for address changes)
    restart() {
        logger.log(`Restarting wallet requests watcher for: ${this.walletAddressNormalized}`);

        this.#stopped = false;
        this.#wsFailures = 0;
        this.#start();
    }
}