import EventEmitter from 'events';
import * as React from 'react';

export interface ReactSync<T> {
    emit(event: 'ready', data: T): boolean;
    on(event: 'ready', listener: (data: T) => void): this;
    off(event: 'ready', listener: (data: T) => void): this;
    once(event: 'ready', listener: (data: T) => void): this;

    emit(event: 'updated', data: T): boolean;
    on(event: 'updated', listener: (data: T) => void): this;
    off(event: 'updated', listener: (data: T) => void): this;
    once(event: 'updated', listener: (data: T) => void): this;
}

export class ReactSync<T> extends EventEmitter {
    #value: T | null = null;

    get value(): T {
        if (!this.#value) {
            throw Error('Value is not ready');
        }
        return this.#value;
    }
    set value(src: T) {
        if (!this.#value) {
            this.#value = src;
            this.emit('ready', src);
        } else {
            this.#value = src;
            this.emit('updated', src);
        }
    }

    get ready() {
        return !!this.#value;
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

    use() {
        const [state, setState] = React.useState(this.value);
        React.useEffect(() => {

            let ended = false;

            // Just in case of race conditions
            if (state !== this.value) {
                setState(this.value);
            }

            // Update handler
            const handler = () => {
                if (ended) {
                    return;
                }
                setState(this.value);
            }

            this.on('updated', handler);
            return () => {
                ended = true;
                this.off('updated', handler);
            };
        }, []);

        return state;
    }

    useOptional() {
        const [state, setState] = React.useState(this.#value);
        React.useEffect(() => {

            let ended = false;

            // Just in case of race conditions
            if (state !== this.#value) {
                setState(this.#value);
            }

            // Update handler
            const handler = () => {
                if (ended) {
                    return;
                }
                setState(this.#value);
            }

            this.on('updated', handler);
            this.on('ready', handler);
            return () => {
                ended = true;
                this.off('updated', handler);
                this.off('ready', handler);
            };
        }, []);

        return state;
    }
}