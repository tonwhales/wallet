import axios from 'axios';
import { beginCell, safeSign } from 'ton';
import { deriveSymmetricPath, keyPairFromSeed, sha256_sync } from 'ton-crypto';
import { AppConfig } from '../../AppConfig';
import { backoff } from '../../utils/time';
import { Engine } from '../Engine';
import * as t from 'io-ts';

async function deriveContentKey(utilityKey: Buffer, contentId: string) {
    let signKey = await deriveSymmetricPath(utilityKey, [AppConfig.isTestnet ? 'sandbox' : 'mainnet', 'content', contentId, 'sign']);
    let encryptKey = await deriveSymmetricPath(utilityKey, [AppConfig.isTestnet ? 'sandbox' : 'mainnet', 'content', contentId, 'encrypt']);
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
    readonly #utilityKey: Buffer

    constructor(engine: Engine, utilityKey: Buffer) {
        this.engine = engine;
        this.#utilityKey = utilityKey;
    }

    async readKey(key: string) {
        return await backoff('cloud', async () => {
            return (await (this.#requestRead(key))).value;
        });
    }

    async update(key: string, updater: (src: Buffer | null) => Buffer | Promise<Buffer>) {
        let current = await backoff('cloud', async () => {
            return await this.#requestRead(key);
        });

        return await backoff('cloud', async () => {
            while (true) {
                let updated = await updater(current.value);
                let res = await this.#requestWrite(key, current.seq, updated);
                if (!res.updated) {
                    current = res.current;
                } else {
                    return res.current.value;
                }
            }
        });
    }

    async #requestRead(key: string): Promise<{ seq: number, value: Buffer | null }> {

        // Prepare
        let keys = await deriveContentKey(this.#utilityKey, key);
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
            return { value: Buffer.from(r.value.value, 'base64'), seq: r.value.seq };
        } else {
            return { value: null, seq: r.value.seq };
        }
    }

    async #requestWrite(key: string, seq: number, value: Buffer): Promise<{ updated: boolean, current: { seq: number, value: Buffer | null } }> {
        // Prepare
        let keys = await deriveContentKey(this.#utilityKey, key);
        let time = Math.floor(Date.now() / 1000) + 60;
        let toSign = beginCell()
            .storeBuffer(keys.signKey.publicKey)
            .storeBuffer(sha256_sync(value))
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
            value: value.toString('base64')
        }, { timeout: 10000 });
        if (!writeCodec.is(res.data)) {
            throw Error('Invalid data');
        }

        let r = res.data;
        if (r.current.value) {
            return {
                updated: r.updated,
                current: { seq: r.current.seq, value: Buffer.from(r.current.value, 'base64') }
            };
        } else {
            return {
                updated: r.updated,
                current: { seq: r.current.seq, value: null }
            };
        }
    }
}