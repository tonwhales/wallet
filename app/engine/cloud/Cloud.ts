import axios from 'axios';
import { beginCell, safeSign } from 'ton';
import { deriveSymmetricPath, getSecureRandomBytes, keyPairFromSeed, openBox, sealBox, sha256_sync } from 'ton-crypto';
import { Engine } from '../Engine';
import * as t from 'io-ts';
import { CloudValue } from './CloudValue';
import * as Automerge from 'automerge';

async function deriveContentKey(utilityKey: Buffer, contentId: string, isTestnet: boolean) {
    let signKey = await deriveSymmetricPath(utilityKey, [isTestnet ? 'sandbox' : 'mainnet', 'content', contentId, 'sign']);
    let encryptKey = await deriveSymmetricPath(utilityKey, [isTestnet ? 'sandbox' : 'mainnet', 'content', contentId, 'encrypt']);
    let signing = keyPairFromSeed(signKey);
    return {
        signKey: signing,
        encryption: encryptKey
    };
}

const readCodec = t.type({
    ok: t.literal(true),
    value: t.type({
        seq: t.number,
        value: t.union([t.null, t.string])
    })
});

const writeCodec = t.type({
    updated: t.boolean,
    current: t.type({
        seq: t.number,
        value: t.union([t.null, t.string])
    })
});

export class Cloud {
    readonly engine: Engine;
    readonly #utilityKey: Buffer;
    readonly #syncs: Map<string, CloudValue<any>> = new Map();

    constructor(engine: Engine, utilityKey: Buffer) {
        this.engine = engine;
        this.#utilityKey = utilityKey;
    }

    get<T>(key: string, initial: (src: T) => void) {
        let ex = this.#syncs.get(key);
        if (ex) {
            return ex as CloudValue<T>;
        }
        let v = new CloudValue<T>(this, key, initial);
        this.#syncs.set(key, v);
        return v;
    }

    counter(key: string) {
        return this.get<{ counter: Automerge.Counter }>(key, (src) => {
            src.counter = new Automerge.Counter();
        });
    }

    async readKey(key: string) {
        return (await (this.#requestRead(key))).value;
    }

    async update(key: string, updater: (src: Buffer | null) => Buffer | Promise<Buffer>) {
        let current = await this.#requestRead(key);
        while (true) {
            let updated = await updater(current.value);
            let res = await this.#requestWrite(key, current.seq, updated);
            if (!res.updated) {
                current = res.current;
            } else {
                return res.current.value;
            }
        }
    }

    async #requestRead(key: string): Promise<{ seq: number, value: Buffer | null }> {

        // Prepare
        let keys = await deriveContentKey(this.#utilityKey, key, this.engine.isTestnet);
        let time = Math.floor(Date.now() / 1000) + 60;
        let toSign = beginCell()
            .storeBuffer(keys.signKey.publicKey)
            .storeUint(time, 32)
            .endCell();
        let signature = safeSign(toSign, keys.signKey.secretKey);

        // Read value
        let res = await axios.post('https://connect.tonhubapi.com/storage/read', {
            key: keys.signKey.publicKey.toString('base64'),
            signature: signature.toString('base64'),
            time
        }, { timeout: 10000 });
        if (!readCodec.is(res.data)) {
            throw Error('Invalid data');
        }

        // Res
        let r = res.data;
        if (r.value.value) {
            let v = Buffer.from(r.value.value, 'base64');
            let nonce = v.slice(0, 24);
            let data = v.slice(24);
            let open = openBox(data, nonce, keys.encryption);
            return { value: open, seq: r.value.seq };
        } else {
            return { value: null, seq: r.value.seq };
        }
    }

    async #requestWrite(key: string, seq: number, value: Buffer): Promise<{ updated: boolean, current: { seq: number, value: Buffer | null } }> {

        // Encrypt
        let keys = await deriveContentKey(this.#utilityKey, key, this.engine.isTestnet);
        let nonce = await getSecureRandomBytes(24);
        let data = sealBox(value, nonce, keys.encryption);
        let encrypted = Buffer.concat([nonce, data]);

        // Prepare
        let time = Math.floor(Date.now() / 1000) + 60;
        let toSign = beginCell()
            .storeBuffer(keys.signKey.publicKey)
            .storeBuffer(sha256_sync(encrypted))
            .storeUint(seq, 32)
            .storeUint(time, 32)
            .endCell();
        let signature = safeSign(toSign, keys.signKey.secretKey);

        // Write value
        let res = await axios.post('https://connect.tonhubapi.com/storage/write', {
            key: keys.signKey.publicKey.toString('base64'),
            signature: signature.toString('base64'),
            time,
            seq,
            value: encrypted.toString('base64')
        }, { timeout: 10000 });
        if (!writeCodec.is(res.data)) {
            throw Error('Invalid data');
        }

        let r = res.data;
        if (r.current.value) {
            let v = Buffer.from(r.current.value, 'base64');
            let nonce = v.slice(0, 24);
            let data = v.slice(24);
            let open = openBox(data, nonce, keys.encryption);
            return {
                updated: r.updated,
                current: { seq: r.current.seq, value: open }
            };
        } else {
            return {
                updated: r.updated,
                current: { seq: r.current.seq, value: null }
            };
        }
    }
}