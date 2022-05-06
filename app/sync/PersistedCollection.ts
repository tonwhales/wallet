import * as t from 'io-ts';
import { MMKV } from 'react-native-mmkv';
import { warn } from '../utils/log';

export type PersistedItem<T> = {
    setValue(value: T | null): void;
    getValue(): T | null;
}

export class PersistedCollection<K, T> {
    #storage: MMKV;
    #namespace: string;
    #key: (src: K) => string;
    #codec: t.Type<T, any>;

    constructor(args: { storage: MMKV, namespace: string, key: (src: K) => string, codec: t.Type<T, any> }) {
        this.#storage = args.storage;
        this.#namespace = args.namespace;
        this.#key = args.key;
        this.#codec = args.codec;
    }

    item(key: K): PersistedItem<T> {
        return {
            setValue: (value: T | null) => {
                this.setValue(key, value);
            },
            getValue: () => {
                return this.getValue(key);
            }
        }
    }

    setValue(key: K, value: T | null) {
        let k = this.#namespace + '.' + this.#key(key);
        if (value === null) {
            this.#storage.delete(k);
        } else {
            if (!this.#codec.is(value)) {
                warn(value);
                throw Error('Invalid value for ' + this.#namespace);
            }
            let encoded = this.#codec.encode(value);
            this.#storage.set(k, JSON.stringify(encoded));
        }
    }

    getValue(key: K): T | null {
        let k = this.#namespace + '.' + this.#key(key);
        let st = this.#storage.getString(k);
        if (st === undefined) {
            return null;
        }
        let json: any;
        try {
            json = JSON.parse(st)
        } catch (e) {
            warn(e);
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