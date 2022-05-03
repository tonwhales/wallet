import EventEmitter from "events";
import * as t from 'io-ts';
import { exponentialBackoffDelay } from "teslabot";

const MESSAGE_TIMEOUT = 10000;
const CONNECTION_TIMEOUT = 5000;

type BlockRef = { seqno: number };
type BlockChanged = { seqno: number, changed: { [key: string]: { hash: string, lt: string } } };

const changeCodec = t.type({
    changed: t.record(t.string, t.type({ hash: t.string, lt: t.string })),
    seqno: t.number
});

export interface BlocksWatcher {
    emit(event: 'new_session', data: BlockRef): boolean
    on(event: 'new_session', listener: (data: BlockRef) => void): this
    once(event: 'new_session', listener: (data: BlockRef) => void): this

    emit(event: 'block', data: BlockChanged): boolean
    on(event: 'block', listener: (data: BlockChanged) => void): this
    once(event: 'block', listener: (data: BlockChanged) => void): this
}

export class BlocksWatcher extends EventEmitter {

    readonly endpoint: string;
    #cursor: { first: BlockRef, current: BlockRef } | null = null;
    #ws: WebSocket | null = null;
    #wsTimer: any | null = null;
    #wsFailures = 0;
    #wsConnected = false;
    #stopped = false;

    constructor(endpoint: string) {
        super();
        this.endpoint = endpoint;
        this.#start();
    }

    get cursor() {
        return this.#cursor;
    }

    #start() {
        if (this.#stopped) {
            return;
        }

        console.log('[blocks]: Connecting');

        // Close existing
        this.#close();

        // Create websocket
        let nws = new WebSocket('wss://' + this.endpoint + '/block/watch/changed');
        nws.onopen = () => {
            if (this.#ws === nws) {
                console.log('[blocks]: Connected');

                // Start message watchdog
                this.#startMessageWatchdog();
            }
        };
        nws.onclose = (ev) => {
            if (this.#ws === nws) {
                // What if connection just aborted
                if (this.#wsConnected) {
                    console.warn('[blocks]: Connection lost: reconnecting immediatelly');
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
                console.warn(e);
                return;
            }
            if (!changeCodec.is(parsed)) {
                console.warn('[blocks]: Invalid block message');
                return;
            }

            // Reset WS failures counter
            this.#wsFailures = 0;
            this.#wsConnected = true;

            // Process
            if (!this.#cursor) {
                console.log('[blocks]: Session started from #' + parsed.seqno);
                this.#cursor = { first: { seqno: parsed.seqno }, current: { seqno: parsed.seqno } };
                this.emit('new_session', { seqno: parsed.seqno });
            } else {

                if (parsed.seqno <= this.#cursor.current.seqno) {
                    // Old block
                    console.warn('[blocks]: Ignoring block index. Received #' + parsed.seqno + ', current cursor #' + this.#cursor.current.seqno);
                } else if (parsed.seqno > this.#cursor.current.seqno + 1) {
                    // Hole detected
                    console.warn('[blocks]: Session lost. Restarting from #' + parsed.seqno);
                    this.#cursor = { first: { seqno: parsed.seqno }, current: { seqno: parsed.seqno } };
                    this.emit('new_session', { seqno: parsed.seqno });
                } else {
                    // Sequental
                    console.log('[blocks]: Valid block #' + parsed.seqno);
                    this.#cursor.current = { seqno: parsed.seqno };
                    this.emit('block', parsed);
                }
            }

            // Restart timer
            this.#startMessageWatchdog();
        };
        this.#ws = nws;

        // Connection timer
        this.#wsTimer = setTimeout(() => {
            this.#reconnectOnFailure();
        }, CONNECTION_TIMEOUT);
    }

    #reconnectOnFailure() {
        this.#wsFailures = Math.max(this.#wsFailures + 1, 50);
        let delay = exponentialBackoffDelay(this.#wsFailures, 1000, 5000, 50);
        console.warn('[blocks]: Connection atttempt failed. Reconnecting in ' + delay + ' ms');
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
            console.warn('[blocks]: Message timeout: restarting');
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