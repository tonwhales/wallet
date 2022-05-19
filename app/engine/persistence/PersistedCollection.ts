import EventEmitter from 'events';
import * as t from 'io-ts';
import { MMKV } from 'react-native-mmkv';
import { atom } from 'recoil';
import { createLogger } from '../../utils/log';
import { Engine } from '../Engine';
import { PersistedItem } from './PersistedItem';

export interface PersistedCollection<K, T> {
    emit(event: 'created', data: { key: K, value: T | null }): boolean;
    on(event: 'created', listener: (data: { key: K, value: T | null }) => void): this;
    off(event: 'created', listener: (data: { key: K, value: T | null }) => void): this;
    once(event: 'created', listener: (data: { key: K, value: T | null }) => void): this;

    emit(event: 'updated', data: { key: K, value: T | null }): boolean;
    on(event: 'updated', listener: (data: { key: K, value: T | null }) => void): this;
    off(event: 'updated', listener: (data: { key: K, value: T | null }) => void): this;
    once(event: 'updated', listener: (data: { key: K, value: T | null }) => void): this;
}

const logger = createLogger('persistence');

export class PersistedCollection<K, T> extends EventEmitter {
    #engine: Engine;
    #storage: MMKV;
    #namespace: string;
    #key: (src: K) => string;
    #codec: t.Type<T, any>;
    #items = new Map<string, PersistedItem<T>>();

    constructor(args: {
        storage: MMKV,
        namespace: string,
        key: (src: K) => string,
        codec: t.Type<T, any>,
        engine: Engine
    }) {
        super();
        this.#engine = args.engine;
        this.#storage = args.storage;
        this.#namespace = args.namespace;
        this.#key = args.key;
        this.#codec = args.codec;
    }

    item(key: K): PersistedItem<T> {
        let id = this.#key(key);
        let ex = this.#items.get(id);
        if (ex) {
            return ex;
        }
        let current = this.#getValue(key);
        let rc = atom<T | null>({
            key: 'persistence/' + this.#namespace + '/' + id,
            default: current
        });
        let events = new EventEmitter();
        let t = this;
        let pitm: PersistedItem<T> = {
            atom: rc,
            update(updater: (value: T | null) => T | null) {
                let updated = updater(t.#getValue(key));
                current = updated;
                t.#setValue(key, updated);
                t.emit('updated', { key, value: current });
                events.emit('updated', current);
                t.#engine.recoil.updater(rc, updated);
            },
            get value() {
                return current;
            },
            on(event: 'updated', callback: (value: T | null) => void) {
                events.on(event, callback);
            },
            off(event: 'updated', callback: (value: T | null) => void) {
                events.off(event, callback);
            },
            once(event: 'updated', callback: (value: T | null) => void) {
                events.once(event, callback);
            },
            for(callback: (value: T) => void) {
                if (current) {
                    callback(current);
                }
                events.on('updated', (e) => {
                    if (e) {
                        callback(e);
                    }
                });
            }
        }
        this.#items.set(id, pitm);
        this.emit('created', { key, value: current });
        logger.log(this.#namespace + '/' + id);
        return pitm;
    }

    setValue(key: K, value: T | null) {
        this.item(key).update(() => value);
    }

    getValue(key: K) {
        return this.item(key).value;
    }

    //
    // Implementation
    //

    #setValue(key: K, value: T | null) {
        let k = this.#namespace + '.' + this.#key(key);
        if (value === null) {
            this.#storage.delete(k);
        } else {
            if (!this.#codec.is(value)) {
                logger.warn(value);
                throw Error('Invalid value for ' + this.#namespace);
            }
            let encoded = this.#codec.encode(value);
            this.#storage.set(k, JSON.stringify(encoded));
        }
    }

    #getValue(key: K): T | null {
        let k = this.#namespace + '.' + this.#key(key);
        let st = this.#storage.getString(k);
        if (st === undefined) {
            return null;
        }
        let json: any;
        try {
            json = JSON.parse(st)
        } catch (e) {
            logger.warn(e);
            return null;
        }
        let decoded = this.#codec.decode(json);
        if (decoded._tag === 'Right') {
            return decoded.right;
        } else {
            return null;
        }
    }
} 