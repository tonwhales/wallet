import EventEmitter from "events";
import { backoff } from "../../utils/time";

export interface InvalidateSync {
    emit(event: 'invalidated'): boolean;
    on(event: 'invalidated', listener: () => void): this;
    off(event: 'invalidated', listener: () => void): this;
    once(event: 'invalidated', listener: () => void): this;

    emit(event: 'ready'): boolean;
    on(event: 'ready', listener: () => void): this;
    off(event: 'ready', listener: () => void): this;
    once(event: 'ready', listener: () => void): this;
}

export class InvalidateSync extends EventEmitter {
    private _invalidated = false;
    private _invalidatedDouble = false;
    private _stopped = false;
    private _command: () => Promise<void>;
    private _key: string;

    constructor(key: string, command: () => Promise<void>) {
        super();
        this._key = key;
        this._command = command;
    }

    get invalidated() {
        return this._invalidated;
    }

    invalidate() {
        if (this._stopped) {
            return;
        }
        if (!this._invalidated) {
            this._invalidated = true;
            this._invalidatedDouble = false;
            this.emit('invalidated');
            this._doSync();
        } else {
            if (!this._invalidatedDouble) {
                this._invalidatedDouble = true;
            }
        }
    }

    stop() {
        if (this._stopped) {
            return;
        }
        this._stopped = true;
    }

    private _doSync = async () => {
        await backoff(this._key, async () => {
            if (this._stopped) {
                return;
            }
            await this._command();
        });
        if (this._stopped) {
            return;
        }
        if (this._invalidatedDouble) {
            this._invalidatedDouble = false;
            this._doSync();
        } else {
            this._invalidated = false;
            this.emit('ready');
        }
    }
}