import { Address, Cell } from "ton";
import { cacheMainnet, cacheTestnet } from "../storage/storage";
import * as t from 'io-ts';
import BN from "bn.js";
import { isLeft } from "fp-ts/lib/Either";

function padLt(src: string) {
    let res = src;
    while (res.length < 20) {
        res = '0' + res;
    }
    return res;
}

const stateStorage = t.type({
    version: t.literal(1),
    balance: t.string,
    state: t.union([t.literal('active'), t.literal('uninitialized'), t.literal('frozen')]),
    seqno: t.number,
    lastTransaction: t.union([t.null, t.type({ lt: t.string, hash: t.string })]),
    syncTime: t.number,
    storedAt: t.number,

    transactionCursor: t.union([t.null, t.type({ lt: t.string, hash: t.string })]),
    transactions: t.array(t.string)
});

function serializeStatus(account: AccountStatus): t.TypeOf<typeof stateStorage> {
    return {
        version: 1,
        balance: account.balance.toString(10),
        state: account.state,
        seqno: account.seqno,
        lastTransaction: account.lastTransaction,
        syncTime: account.syncTime,
        storedAt: account.storedAt,
        transactionCursor: account.transactionCursor,
        transactions: account.transactions
    };
}

function parseStatus(src: any): AccountStatus | null {
    const parsed = stateStorage.decode(src);
    if (isLeft(parsed)) {
        return null;
    }
    const stored = parsed.right;
    return {
        balance: new BN(stored.balance, 10),
        state: stored.state,
        seqno: stored.seqno,
        lastTransaction: stored.lastTransaction,
        syncTime: stored.syncTime,
        storedAt: stored.storedAt,
        transactionCursor: stored.transactionCursor,
        transactions: stored.transactions
    };
}

export type AccountStatus = {

    // State
    balance: BN,
    state: 'active' | 'uninitialized' | 'frozen',
    seqno: number,
    lastTransaction: { lt: string, hash: string } | null,
    syncTime: number,
    storedAt: number,

    // Transactions
    transactionCursor: { lt: string, hash: string } | null,
    transactions: string[]
};

function createCache(testnet: boolean) {
    const mmkv = testnet ? cacheTestnet : cacheMainnet;

    return {
        storeTransaction: (address: Address, lt: string, data: string) => {
            mmkv.set('tx_' + address.toFriendly() + '_' + padLt(lt), data);
        },
        loadTransaction: (address: Address, lt: string) => {
            let data = mmkv.getString('tx_' + address.toFriendly() + '_' + padLt(lt));
            if (data) {
                return Cell.fromBoc(Buffer.from(data, 'base64'))[0];
            } else {
                return null;
            }
        },
        storeState: (address: Address, state: AccountStatus) => {
            const serialized = JSON.stringify(serializeStatus(state));
            mmkv.set('account_' + address.toFriendly(), serialized);
        },
        loadState: (address: Address) => {
            let s = mmkv.getString('account_' + address.toFriendly());
            if (s) {
                return parseStatus(s);
            } else {
                return null;
            }
        }
    };
}

export const mainnetCache = createCache(false);
export const testnetCache = createCache(true);