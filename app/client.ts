import { BN } from "bn.js";
import { Address, TonClient } from "ton";
import axios from 'axios';

export const client = new TonClient({ endpoint: 'https://scalable-api.tonwhales.com/jsonRPC' });

export async function fetchBalance(address: Address) {
    return (await fetchAccountState(address)).balance;
}

export async function fetchAccountState(address: Address) {
    let res = await axios.get('https://ton-storage.tonhub.com/address/' + address.toFriendly(), { timeout: 5000 });
    let data = res.data as {
        address: string,
        balance: string,
        state: 'active' | 'uninitialized' | 'frozen',
        code: string | null,
        data: string | null,
        lastTransaction: { lt: string, hash: string } | null,
        timestamp: number
    }
    return {
        address: Address.parse(data.address),
        balance: new BN(data.balance, 10),
        state: data.state,
        code: data.code ? Buffer.from(data.code, 'base64') : null,
        data: data.data ? Buffer.from(data.data, 'base64') : null,
        lastTransaction: data.lastTransaction,
        timestamp: data.timestamp
    };
}

export type SimpleTransaction = {
    utime: number,
    id: { lt: string, hash: string },
    data: string
}

export async function fetchAccountTransactions(address: Address, limit: number, from: { lt: string, hash: string }): Promise<SimpleTransaction[]> {
    let res = await axios.get('http://scalable-api.tonwhales.com/getTransactions?address=' + address.toFriendly() + '&limit=' + limit + '&lt=' + from.lt + '&hash=' + Buffer.from(from.hash, 'base64').toString('hex'));
    if (!res.data.ok) {
        throw Error('Server error');
    }
    let data = res.data.result as {
        utime: number,
        transaction_id: {
            lt: string,
            hash: string
        },
        data: string
    }[];

    return data.map((d) => ({
        utime: d.utime,
        id: { hash: d.transaction_id.hash, lt: d.transaction_id.lt },
        data: d.data
    }))
}