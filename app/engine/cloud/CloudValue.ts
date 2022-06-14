import * as React from 'react';
import EventEmitter from 'events';
import { InvalidateSync } from "../utils/InvalidateSync";
import { Cloud } from "./Cloud";
import * as Automerge from 'automerge';
import { createLogger, warn } from '../../utils/log';

export interface CloudValue<T> {
    emit(event: 'updated', data: T): boolean;
    on(event: 'updated', listener: (data: T) => void): this;
    off(event: 'updated', listener: (data: T) => void): this;
    once(event: 'updated', listener: (data: T) => void): this;
}


export class CloudValue<T> extends EventEmitter {
    #cloud: Cloud;
    #key: string;
    #sync: InvalidateSync;
    #value: Automerge.Doc<T>;

    constructor(cloud: Cloud, key: string, initial: () => Automerge.Doc<T>) {
        super();
        this.#cloud = cloud;
        this.#key = key;

        // Load initial value
        let v: Automerge.Doc<T> | null = null;
        let existing = cloud.engine.persistence.cloud.getValue({ key, address: cloud.engine.address });
        if (existing) {
            try {
                v = Automerge.load<T>(existing);
            } catch (e) {
                // Ignore errors
            }
        }
        if (v) {
            this.#value = v;
        } else {
            this.#value = initial();
        }

        // Configure sync
        const logger = createLogger('cloud');
        this.#sync = new InvalidateSync('cloud:' + key, async () => {
            logger.log(`Updating ${key}, current: ${JSON.stringify(this.#value)}`);
            let current = this.#value;
            let updated = await cloud.update(key, (src) => {
                logger.log('Updating');
                if (src) {
                    try {
                        let ex = Automerge.load<T>(src.toString());
                        logger.log(`Merging ${key}, local: ${JSON.stringify(current)}, remote: ${JSON.stringify(ex)}`);
                        let merged = Automerge.merge(current, ex);
                        return Buffer.from(Automerge.save(merged));
                    } catch (e) {
                        warn(e);
                    }
                }

                return Buffer.from(Automerge.save(current));
            });
            if (updated) {
                this.#value = Automerge.merge(this.#value, Automerge.load<T>(updated as any));
                this.emit('updated', this.value);
            }
        });
        this.#sync.invalidate();
    }

    get value() {
        return this.#value as T;
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

    update = (updater: (src: T) => void) => {

        // Apply diff
        let res = Automerge.change(this.#value, (s) => {
            updater(s);
        });

        // Update value
        this.#value = res;
        this.#cloud.engine.persistence.cloud.setValue({ address: this.#cloud.engine.address, key: this.#key }, Automerge.save(res));
        this.emit('updated', this.value);

        // Sync
        this.#sync.invalidate();
    }
}