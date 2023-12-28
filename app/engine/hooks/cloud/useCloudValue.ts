import axios from 'axios';
import { beginCell, safeSign } from '@ton/core';
import { deriveSymmetricPath, getSecureRandomBytes, keyPairFromSeed, openBox, sealBox, sha256_sync } from '@ton/crypto';
import * as t from 'io-ts';
import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { useSelectedAccount } from '../appstate/useSelectedAccount';
import { useNetwork } from '../network/useNetwork';
import { useMemo } from 'react';
import { queryClient } from '../../clients';
import { AutomergeValue } from '../../cloud/AutomergeValue';

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

async function readValueFromCloud(key: string, params: { utilityKey: Buffer, isTestnet: boolean }) {
    let keys = await deriveContentKey(params.utilityKey, key, params.isTestnet);
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


async function writeValueToCloud(key: string, seq: number, value: Buffer, params: { utilityKey: Buffer, isTestnet: boolean }) {
    // Encrypt
    let keys = await deriveContentKey(params.utilityKey, key, params.isTestnet);
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

async function updateCloudValue(key: string, updater: (value: Buffer | null) => Promise<Buffer>, params: { utilityKey: Buffer, isTestnet: boolean }) {
    let current = await readValueFromCloud(key, params);
    while (true) {
        let updated = await updater(current.value);
        let res = await writeValueToCloud(key, current.seq, updated, params);
        if (!res.updated) {
            current = res.current;
        } else {
            return res.current.value;
        }
    }
}

export function useCloudValue<T>(key: string, initial: (src: T) => void): [T, (updater: (value: T) => void) => Promise<void>] {
    const account = useSelectedAccount();
    const { isTestnet } = useNetwork();
    const queryKey = Queries.Cloud(account?.addressString || 'null-address-string').Key(key);

    let valueQuery = useQuery({
        queryKey,
        queryFn: async () => {
            if (!account) {
                return null;
            }
            let data = await readValueFromCloud(key, {
                isTestnet: isTestnet,
                utilityKey: account.utilityKey,
            });
            
            return data.value?.toString('base64') || null;
        },
        refetchOnMount: true
    });

    const localAmValue = useMemo(() => valueQuery.data ? AutomergeValue.fromExisting<T>(Buffer.from(valueQuery.data, 'base64')) : AutomergeValue.fromEmpty<T>(initial), [valueQuery]);

    const update = async (updater: (prevValue: T) => void) => {
        if (!account) {
            return;
        }
        localAmValue.update(updater);
        queryClient.setQueryData(Queries.Cloud(account.addressString).Key(key), localAmValue.save().toString('base64'));
        
        await updateCloudValue(key, async (buffer) => {
            let remoteAmValue = AutomergeValue.fromExisting<T>(buffer || AutomergeValue.fromEmpty<T>(initial).save());
            
            remoteAmValue.apply(localAmValue);

            return remoteAmValue.save();
        }, { utilityKey: account.utilityKey, isTestnet });
    }


    return [localAmValue.getDoc() as T, update];
}