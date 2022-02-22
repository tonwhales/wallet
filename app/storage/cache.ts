import { Address, Cell } from "ton";
import * as t from 'io-ts';
import BN from "bn.js";
import { isLeft } from "fp-ts/lib/Either";
import { MMKV } from "react-native-mmkv";
import { AppConfig } from "../AppConfig";
import { AccountState } from "../sync/Engine";

function padLt(src: string) {
    let res = src;
    while (res.length < 20) {
        res = '0' + res;
    }
    return res;
}

//
// Account State (Address + Transactions)
//

const stateStorage = t.type({
    version: t.literal(2),
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
        version: 2,
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

const addressStateStorage = t.type({
    version: t.literal(1),
    balance: t.string,
    state: t.union([t.literal('active'), t.literal('uninitialized'), t.literal('frozen')]),
    lastTransaction: t.union([t.null, t.type({ lt: t.string, hash: t.string })]),
    code: t.union([t.string, t.null]),
    data: t.union([t.string, t.null]),
    syncTime: t.number,
    storedAt: t.number
});

const priceStateStorage = t.type({
    price: t.type({ usd: t.number })
});

function parsePriceState(src: any): PriceState | null {
    const parsed = priceStateStorage.decode(src);

    if (isLeft(parsed)) {
        return null;
    }

    return parsed.right;
}

function serializeAddressState(state: AddressState): t.TypeOf<typeof addressStateStorage> {
    return {
        version: 1,
        balance: state.balance.toString(10),
        state: state.state,
        lastTransaction: state.lastTransaction,
        syncTime: state.syncTime,
        storedAt: state.storedAt,
        code: state.code ? state.code.toBoc({ idx: false }).toString('base64') : null,
        data: state.data ? state.data.toBoc({ idx: false }).toString('base64') : null
    }
}

function parseAddressState(src: any): AddressState | null {
    const parsed = addressStateStorage.decode(src);
    if (isLeft(parsed)) {
        return null;
    }
    const stored = parsed.right;
    return {
        balance: new BN(stored.balance, 10),
        state: stored.state,
        lastTransaction: stored.lastTransaction,
        syncTime: stored.syncTime,
        storedAt: stored.storedAt,
        code: stored.code ? Cell.fromBoc(Buffer.from(stored.code, 'base64'))[0] : null,
        data: stored.data ? Cell.fromBoc(Buffer.from(stored.data, 'base64'))[0] : null
    };
}

//
// Public
//

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

export type AddressState = {
    balance: BN,
    state: 'active' | 'uninitialized' | 'frozen',
    lastTransaction: { lt: string, hash: string } | null,
    code: Cell | null,
    data: Cell | null,
    syncTime: number,
    storedAt: number,
};

export type PriceState = {
    price: {
        usd: number
    }
}

export function createCache(store: MMKV) {
    return {
        storeTransaction: (address: Address, lt: string, data: string) => {
            store.set('tx_' + address.toFriendly({ testOnly: AppConfig.isTestnet }) + '_' + padLt(lt), data);
        },
        loadTransaction: (address: Address, lt: string) => {
            let data = store.getString('tx_' + address.toFriendly({ testOnly: AppConfig.isTestnet }) + '_' + padLt(lt));
            if (data) {
                return Cell.fromBoc(Buffer.from(data, 'base64'))[0];
            } else {
                return null;
            }
        },
        storeState: (address: Address, state: AccountStatus) => {
            const serialized = JSON.stringify(serializeStatus(state));
            store.set('account_' + address.toFriendly({ testOnly: AppConfig.isTestnet }), serialized);
        },
        loadState: (address: Address) => {
            let s = store.getString('account_' + address.toFriendly({ testOnly: AppConfig.isTestnet }));
            if (s) {
                return parseStatus(JSON.parse(s));
            } else {
                return null;
            }
        },
        storeAddressState: (address: Address, state: AddressState) => {
            const serialized = JSON.stringify(serializeAddressState(state));
            store.set('address_' + address.toFriendly({ testOnly: AppConfig.isTestnet }), serialized);
        },
        loadAddressState: (address: Address) => {
            let s = store.getString('address_' + address.toFriendly({ testOnly: AppConfig.isTestnet }));
            if (s) {
                return parseAddressState(JSON.parse(s));
            } else {
                return null;
            }
        },
        storeCoin: (name: string, value: BN | null) => {
            if (value) {
                store.set('coin_' + name, value.toString(10))
            } else {
                store.delete('coin_' + name);
            }
        },
        loadCoin: (name: string) => {
            let ex = store.getString('coin_' + name);
            if (ex) {
                return new BN(ex, 10);
            } else {
                return null;
            }
        },
        storePrice: (price: PriceState) => {
            store.set('price_', JSON.stringify(price));
        },
        loadPrice: () => {
            let price = store.getString('price_');
            if (price) {
                return parsePriceState(JSON.parse(price));
            } else {
                return null;
            }
        }
    };
}