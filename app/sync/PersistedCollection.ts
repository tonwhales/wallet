import * as t from 'io-ts';
import { MMKV } from 'react-native-mmkv';
import { warn } from '../utils/log';

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

    setValue(key: K, value: T | null) {
        let k = this.#namespace + '.' + this.#key(key);
        if (value === null) {
            this.#storage.delete(k);
        } else {
            if (!this.#codec.is(value)) {
                throw Error('Invalid value');
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