import { MMKV } from "react-native-mmkv";
import { Address } from "ton";
import { AppConfig } from "../AppConfig";
import { PersistedCollection } from "./PersistedCollection";
import * as t from 'io-ts';
import BN from "bn.js";

export type LiteAccountPersisted = {
    balance: string;
    last: { lt: string, hash: string } | null,
    block: number;
}

export type FullAccountPersisted = {
    balance: string;
    last: { lt: string, hash: string } | null,
    block: number;

    transactionCursor: { lt: string, hash: string } | null,
    transactions: string[]
}

export type WalletPersisted = {
    seqno: number;
    balance: string,
    transactions: string[]
}

export class Persistence {

    readonly liteAccounts: PersistedCollection<Address, LiteAccountPersisted>;
    readonly fullAccounts: PersistedCollection<Address, FullAccountPersisted>;
    readonly transactions: PersistedCollection<{ address: Address, lt: BN }, string>;
    readonly wallets: PersistedCollection<Address, WalletPersisted>;
    readonly smartCursors: PersistedCollection<{ key: string, address: Address }, number>;

    constructor(storage: MMKV) {
        this.liteAccounts = new PersistedCollection({ storage, namespace: 'liteAccounts', key: addressKey, codec: liteAccountCodec });
        this.fullAccounts = new PersistedCollection({ storage, namespace: 'fullAccounts', key: addressKey, codec: fullAccountCodec });
        this.wallets = new PersistedCollection({ storage, namespace: 'wallets', key: addressKey, codec: walletCodec });
        this.transactions = new PersistedCollection({ storage, namespace: 'transactions', key: transactionKey, codec: t.string });
        this.smartCursors = new PersistedCollection({ storage, namespace: 'cursors', key: keyedAddressKey, codec: t.number });
    }
}

// Key formats
const addressKey = (src: Address) => src.toFriendly({ testOnly: AppConfig.isTestnet });
const transactionKey = (src: { address: Address, lt: BN }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.lt.toString(10);
const keyedAddressKey = (src: { address: Address, key: string }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.key;

// Codecs
const liteAccountCodec = t.type({
    balance: t.string,
    block: t.number,
    last: t.union([t.null, t.type({ lt: t.string, hash: t.string })])
});
const fullAccountCodec = t.type({
    balance: t.string,
    block: t.number,
    last: t.union([t.null, t.type({ lt: t.string, hash: t.string })]),

    transactionCursor: t.union([t.null, t.type({ lt: t.string, hash: t.string })]),
    transactions: t.array(t.string)
});
const walletCodec = t.type({
    seqno: t.number,
    balance: t.string,
    transactions: t.array(t.string)
});