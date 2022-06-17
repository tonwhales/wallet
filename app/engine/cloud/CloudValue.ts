import * as React from 'react';
import EventEmitter from 'events';
import { InvalidateSync } from "../utils/InvalidateSync";
import { Cloud } from "./Cloud";
import * as Automerge from 'automerge';
import { createLogger, warn } from '../../utils/log';
import { atom, RecoilState, useRecoilValue } from 'recoil';
import { AppConfig } from '../../AppConfig';

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
    readonly atom: RecoilState<T>;

    constructor(cloud: Cloud, key: string, init: (src: T) => void) {
        super();
        this.#cloud = cloud;
        this.#key = key;

        // Load initial value
        let v: Automerge.Doc<T> | null = null;
        let existing = cloud.engine.persistence.cloud.getValue({ key, address: cloud.engine.address });
        if (existing) {
            try {
                v = Automerge.load<T>(Buffer.from(existing, 'base64') as any);
            } catch (e) {
                // Ignore errors
            }
        }
        if (v) {
            this.#value = v;
        } else {

            // Create schema
            let schema = Automerge.change(Automerge.init<T>({ actorId: '0000' }), { time: 0 }, (src) => {
                init(src);
            });
            let initChange = Automerge.getLastLocalChange(schema);

            // Create initial document
            let [doc] = Automerge.applyChanges(Automerge.init<T>(), [initChange])
            this.#value = doc;
        }

        // Atom
        this.atom = atom({
            key: 'cloud/' + cloud.engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/' + key,
            dangerouslyAllowMutability: true,
            default: this.#value as T
        });

        // Configure sync
        const logger = createLogger('cloud');
        this.#sync = new InvalidateSync('cloud:' + key, async () => {
            logger.log(`Updating ${key}, current: ${JSON.stringify(this.#value)}`);
            let current = Automerge.clone(this.#value);
            let updated = await cloud.update(key, (src) => {
                logger.log('Updating');
                if (src) {
                    try {
                        let ex = Automerge.load<T>(src as any);
                        logger.log(`Merging ${key}, local: ${JSON.stringify(current)}, remote: ${JSON.stringify(ex)}`);
                        let merged = Automerge.merge(current, ex);
                        return Buffer.from(Automerge.save(merged));
                    } catch (e) {
                        console.warn(e);
                    }
                }

                return Buffer.from(Automerge.save(current));
            });
            if (updated) {
                this.#value = Automerge.merge(this.#value, Automerge.load<T>(updated as any));
                this.emit('updated', this.value);
                this.#cloud.engine.recoil.updater(this.atom, this.value);
            }
        });
        this.#sync.invalidate();
    }

    get value() {
        return this.#value as T;
    }

    use() {
        return useRecoilValue(this.atom);
    }

    update = (updater: (src: T) => void) => {

        // Apply diff
        let res = Automerge.change(this.#value, (s) => {
            updater(s);
        });

        // Update value
        this.#value = res;
        this.#cloud.engine.persistence.cloud.setValue({ address: this.#cloud.engine.address, key: this.#key }, Buffer.from(Automerge.save(res)).toString('base64'));
        this.emit('updated', this.value);
        this.#cloud.engine.recoil.updater(this.atom, this.value);

        // Sync
        this.#sync.invalidate();
    }
}