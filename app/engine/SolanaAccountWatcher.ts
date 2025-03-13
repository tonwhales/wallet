import EventEmitter from "events";
import { createLogger } from "../utils/log";
import { exponentialBackoffDelay } from "teslabot";

const MESSAGE_TIMEOUT = 60 * 1000 * 1;
const CONNECTION_TIMEOUT = 5000;

const logger = createLogger('solana-account-watcher');

export class SolanaAccountWatcher extends EventEmitter {
    readonly endpoint: string;
    readonly address: string;
    #ws: WebSocket | null = null;
    #wsTimer: any | null = null;
    #wsFailures = 0;
    #wsConnected = false;
    #stopped = false;
    #connectingLock: (() => void) | null = null;

    constructor(endpoint: string, address: string) {
        super();
        this.endpoint = endpoint;
        this.address = address;
        this.#start();
    }

    #start() {
        if (this.#stopped) {
            return;
        }

        logger.log('Connecting');

        this.#close();

        let nws = new WebSocket(this.endpoint);

        nws.onopen = () => {
            if (this.#ws === nws) {
                logger.log('Connected');

                // Start message watchdog
                this.#startMessageWatchdog();
                this.#subscribe();
            }
        };
        nws.onclose = (ev) => {
            if (this.#ws === nws) {
                // What if connection just aborted
                if (this.#wsConnected) {
                    logger.warn('Connection lost: reconnecting immediatelly');
                    this.#wsConnected = false;
                    this.#wsFailures = 0;
                    this.#start();
                    return;
                } else {
                    this.#reconnectOnFailure();
                }
            }
        };
        nws.onmessage = (ev) => {

            // Parse message
            if (this.#ws !== nws) {
                return;
            }
            if (typeof ev.data !== 'string') {
                return;
            }
            let parsed: any;
            try {
                parsed = JSON.parse(ev.data);
            } catch (e) {
                logger.warn(e);
                return;
            }

            // TODO: validate message
            console.log('solana-acc message', ev.data);
            //
            this.emit('message', parsed);

            // Reset WS failures counter
            this.#wsFailures = 0;
            this.#wsConnected = true;

            // Process
            // if (!this.#cursor) {
            //     logger.log('Session started from #' + parsed.seqno);
            //     this.#cursor = { first: { seqno: parsed.seqno }, current: { seqno: parsed.seqno } };
            //     this.emit('new_session', { seqno: parsed.seqno });
            // } else {

            //     if (parsed.seqno <= this.#cursor.current.seqno) {
            //         // Old block
            //         if (parsed.seqno !== this.#cursor.current.seqno) {
            //             logger.warn('Ignoring block index. Received #' + parsed.seqno + ', current cursor #' + this.#cursor.current.seqno);
            //         }
            //     } else if (parsed.seqno > this.#cursor.current.seqno + 1) {
            //         // Hole detected
            //         logger.warn('Session lost. Restarting from #' + parsed.seqno);
            //         this.#cursor = { first: { seqno: parsed.seqno }, current: { seqno: parsed.seqno } };
            //         this.emit('new_session', { seqno: parsed.seqno });

            //     } else {
            //         // Sequental
            //         logger.log('Valid block #' + parsed.seqno);
            //         this.#cursor.current = { seqno: parsed.seqno };
            //         this.emit('block', parsed);
            //     }
            // }

            // Lock release
            if (this.#connectingLock) {
                this.#connectingLock();
                this.#connectingLock = null;
            }

            // Restart timer
            this.#startMessageWatchdog();
        };
        this.#ws = nws;

        this.#wsTimer = setTimeout(() => {
            this.#reconnectOnFailure();
        }, CONNECTION_TIMEOUT);
    }

    #reconnectOnFailure() {
        // Retry delay
        this.#wsFailures = Math.max(this.#wsFailures + 1, 50);
        let delay = exponentialBackoffDelay(this.#wsFailures, 1000, 5000, 50);
        logger.warn('Connection atttempt failed. Reconnecting in ' + delay + ' ms');
        this.#close();

        // Reconnect
        this.#wsTimer = setTimeout(() => {
            this.#start();
        }, delay);
    }

    #startMessageWatchdog() {

        // Reset reconnection timer
        if (this.#wsTimer) {
            clearTimeout(this.#wsTimer);
            this.#wsTimer = null;
        }

        // Start timeout
        this.#wsTimer = setTimeout(() => {
            logger.warn('Message timeout: restarting');
            this.#start();
        }, MESSAGE_TIMEOUT);
    }

    #close() {
        // Reset reconnection timer
        if (this.#wsTimer) {
            clearTimeout(this.#wsTimer);
            this.#wsTimer = null;
        }

        // Close existing connection
        if (this.#ws) {
            let w = this.#ws;
            this.#ws = null;
            try {
                w.close();
            } catch (e) {
                // Ignore
            }
        }
    }

    #subscribe() {
        const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "accountSubscribe",
            params: [
                this.address,
                {
                    "encoding": "jsonParsed"
                }
            ]
        };
        this.#ws?.send(JSON.stringify(request));
    }

    stop() {
        if (this.#stopped) {
            return;
        }
        this.#stopped = true;

        // Stop WS
        if (this.#ws) {
            let w = this.#ws;
            this.#ws = null;
            try {
                w.close();
            } catch (e) {
                // Ignore
            }
        }
    }
}