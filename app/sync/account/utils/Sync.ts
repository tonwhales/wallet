import * as React from 'react';
import EventEmitter from "events";
import { PersistedCollection } from "../../PersistedCollection";
import { InvalidateSync } from 'teslabot';

export interface Sync<K, T> {
    emit(event: 'ready', data: { key: K, state: T }): boolean;
    on(event: 'ready', listener: (data: { key: K, state: T }) => void): this;
    off(event: 'ready', listener: (data: { key: K, state: T }) => void): this;
    once(event: 'ready', listener: (data: { key: K, state: T }) => void): this;

    emit(event: 'updated', data: { key: K, state: T }): boolean;
    on(event: 'updated', listener: (data: { key: K, state: T }) => void): this;
    off(event: 'updated', listener: (data: { key: K, state: T }) => void): this;
    once(event: 'updated', listener: (data: { key: K, state: T }) => void): this;
}

export abstract class Sync<K, T> extends EventEmitter {
    readonly collection: PersistedCollection<K, T>;

    #state: T | null = null;
    #sync: InvalidateSync

    constructor(args: { key: K, collection: PersistedCollection<K, T> }) {
        super();
        this.collection = args.collection;
        this.#sync = new InvalidateSync(async () => {
            let res = await this.doSync(args.key);
            if (res === null) {
                return;
            }
            let first = !this.#state;
            this.#state = res;
            this.collection.setValue(args.key, res);
            if (first) {
                this.emit('ready', { key: args.key, state: res });
            } else {
                this.emit('updated', { key: args.key, state: res });
            }
        });
        let ex = this.collection.getValue(args.key);
        if (ex) {
            this.#state = ex;
        }
        this.#sync.invalidate();
    }

    invalidate() {
        this.#sync.invalidate();
    }

    abstract doSync(key: K): Promise<T | null>;

    get state() {
        if (!this.#state) {
            throw Error('Not ready');
        }
        return this.#state!
    }

    get ready() {
        return !!this.#state;
    }

    useState() {
        const [state, setState] = React.useState(this.state);
        React.useEffect(() => {

            let ended = false;

            // Just in case of race conditions
            if (state !== this.state) {
                setState(this.state);
            }

            // Update handler
            const handler = () => {
                if (ended) {
                    return;
                }
                setState(this.state);
            }

            this.on('updated', handler);
            return () => {
                ended = true;
                this.off('updated', handler);
            };
        }, []);
        return state;
    }

    async awaitReady() {
        await new Promise<void>((resolve) => {
            if (this.ready) {
                resolve();
            } else {
                this.once('ready', () => resolve());
            }
        });
    }
}