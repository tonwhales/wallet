import EventEmitter from 'events';
import { InvalidateSync } from "../utils/InvalidateSync";
import { Cloud } from "./Cloud";
import { createLogger } from '../../../utils/log';
import { atom, RecoilState, useRecoilValue } from 'recoil';
import { AutomergeValue } from './AutomergeValue';

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
    #value: AutomergeValue<T>;
    readonly atom: RecoilState<T>;

    constructor(cloud: Cloud, key: string, init: (src: T) => void) {
        super();
        this.#cloud = cloud;
        this.#key = key;

        // Load initial value
        let v: AutomergeValue<T> | null = null;
        let existing = cloud.engine.persistence.cloud.getValue({ key, address: cloud.engine.address });
        if (existing) {
            try {
                let e = AutomergeValue.fromExisting<T>(Buffer.from(existing, 'base64'));
                e.apply(e.clone()); // Check validity
                v = e;
            } catch (e) {
                // Ignore errors
            }
        }
        if (v) {
            this.#value = v;
        } else {
            this.#value = AutomergeValue.fromEmpty(init);
        }

        // Atom
        this.atom = atom({
            key: 'cloud/' + cloud.engine.address.toFriendly({ testOnly: this.#cloud.engine.isTestnet }) + '/' + key,
            dangerouslyAllowMutability: true,
            default: this.#value.getDoc() as T
        });

        // Configure sync
        const logger = createLogger('cloud');
        this.#sync = new InvalidateSync('cloud:' + key, async () => {
            logger.log(`Updating ${key}, current: ${JSON.stringify(this.#value.getDoc())}`);
            let current = this.#value.clone();
            let updated = await cloud.update(key, (src) => {
                if (src) {
                    try {
                        // Load value
                        let ex = AutomergeValue.fromExisting<T>(src);
                        logger.log(`Merging ${key}, local: ${JSON.stringify(current.getDoc())}, remote: ${JSON.stringify(ex.getDoc())}`);

                        // Apply value
                        current.apply(ex);
                    } catch (e) {
                        console.warn(e);
                    }
                }

                // Fallback
                return current.save();
            });
            if (updated) {

                // Apply Change
                let loaded = AutomergeValue.fromExisting<T>(updated);
                this.#value.apply(loaded);
                logger.log(`Received ${key}, current: ${JSON.stringify(this.#value.getDoc())}`);

                // Notify
                this.emit('updated', this.value);
                this.#cloud.engine.recoil.updater(this.atom, this.value);
            }
        });
        this.#sync.invalidate();
    }

    invalidate() {
        this.#sync.invalidate();
    }

    get value() {
        return this.#value.getDoc() as T;
    }

    use() {
        return useRecoilValue(this.atom);
    }

    update = (updater: (src: T) => void) => {

        // Apply diff
        this.#value.update(updater);
        this.#cloud.engine.persistence.cloud.setValue({ address: this.#cloud.engine.address, key: this.#key }, this.#value.save().toString('base64'));
        this.emit('updated', this.value);
        this.#cloud.engine.recoil.updater(this.atom, this.value);

        // Sync
        this.#sync.invalidate();
    }
}