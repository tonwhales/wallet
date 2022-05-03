import * as t from 'io-ts';
import { MMKV } from 'react-native-mmkv';

export class PersistedCollection<K, T> {
    #storage: MMKV;
    #namespace: string;
    #key: (src: K) => string;
    #codec: t.Type<T>;

    constructor(args: { storage: MMKV, namespace: string, key: (src: K) => string, codec: t.Type<T> }) {
        this.#storage = args.storage;
        this.#namespace = args.namespace;
        this.#key = args.key;
        this.#codec = args.codec;
    }

    setValue(key: K, value: T | null) {
        let k = this.#namespace + '.' + this.#key(key);
        if (value === null) {
            this.#storage.delete(k);
        } else {
            if (!this.#codec.is(value)) {
                throw Error('Invalid value');
            }
            this.#storage.set(k, JSON.stringify(value));
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
            console.warn(e);
            return null;
        }
        if (this.#codec.is(json)) {
            return json;
        } else {
            return null;
        }
    }
} 