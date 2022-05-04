import { MMKV } from "react-native-mmkv";
import { Address } from "ton";
import { AppConfig } from "../AppConfig";
import { PersistedCollection } from "./PersistedCollection";
import { SubscriptionsStateData } from '../sync/fetchSubscriptions';
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

export type StakingPersisted = {
    params: {
        minStake: string,
        depositFee: string,
        withdrawFee: string,
        stakeUntil: number,
        receiptPrice: string
    },
    member: {
        balance: string,
        pendingDeposit: string,
        pendingWithdraw: string,
        withdraw: string
    }
}

export type SubscriptionsPersisted = {
    updatedAt: number,
    subscriptions: SubscriptionPersisted[]
}

export type SubscriptionPersisted = {
    wallet: string,
    beneficiary: string,
    amount: string,
    period: number,
    startAt: number,
    timeout: number,
    lastPayment: number,
    lastRequest: number,
    failedAttempts: number,
    subscriptionId: number
}

export class Persistence {

    readonly version: number = 1;
    readonly liteAccounts: PersistedCollection<Address, LiteAccountPersisted>;
    readonly fullAccounts: PersistedCollection<Address, FullAccountPersisted>;
    readonly transactions: PersistedCollection<{ address: Address, lt: BN }, string>;
    readonly wallets: PersistedCollection<Address, WalletPersisted>;
    readonly smartCursors: PersistedCollection<{ key: string, address: Address }, number>;
    readonly prices: PersistedCollection<void, { price: { usd: number } }>;
    readonly apps: PersistedCollection<Address, string>;
    readonly staking: PersistedCollection<{ address: Address, target: Address }, StakingPersisted>;
    readonly subscriptions: PersistedCollection<Address, SubscriptionsPersisted>;

    constructor(storage: MMKV) {
        if (storage.getNumber('storage-version') !== this.version) {
            storage.clearAll();
            storage.set('storage-version', this.version);
        }
        this.liteAccounts = new PersistedCollection({ storage, namespace: 'liteAccounts', key: addressKey, codec: liteAccountCodec });
        this.fullAccounts = new PersistedCollection({ storage, namespace: 'fullAccounts', key: addressKey, codec: fullAccountCodec });
        this.wallets = new PersistedCollection({ storage, namespace: 'wallets', key: addressKey, codec: walletCodec });
        this.transactions = new PersistedCollection({ storage, namespace: 'transactions', key: transactionKey, codec: t.string });
        this.smartCursors = new PersistedCollection({ storage, namespace: 'cursors', key: keyedAddressKey, codec: t.number });
        this.prices = new PersistedCollection({ storage, namespace: 'prices', key: voidKey, codec: priceCodec });
        this.apps = new PersistedCollection({ storage, namespace: 'apps', key: addressKey, codec: t.string });
        this.staking = new PersistedCollection({ storage, namespace: 'staking', key: addressWithTargetKey, codec: stakingPoolStateCodec });
        this.subscriptions = new PersistedCollection({ storage, namespace: 'subscriptions', key: addressKey, codec: subscriptionsStateStorage });
    }
}

// Key formats
const addressKey = (src: Address) => src.toFriendly({ testOnly: AppConfig.isTestnet });
const addressWithTargetKey = (src: { address: Address, target: Address }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.target.toFriendly({ testOnly: AppConfig.isTestnet });
const transactionKey = (src: { address: Address, lt: BN }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.lt.toString(10);
const keyedAddressKey = (src: { address: Address, key: string }) => src.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '::' + src.key;
const voidKey = (src: void) => 'void';

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
const priceCodec = t.type({
    price: t.type({
        usd: t.number
    })
});
const stakingPoolStateCodec = t.type({
    params: t.type({
        minStake: t.string,
        depositFee: t.string,
        withdrawFee: t.string,
        stakeUntil: t.number,
        receiptPrice: t.string
    }),
    member: t.type({
        balance: t.string,
        pendingDeposit: t.string,
        pendingWithdraw: t.string,
        withdraw: t.string
    })
});
const subscriptionStateStorage = t.type({
    wallet: t.string,
    beneficiary: t.string,
    amount: t.string,
    period: t.number,
    startAt: t.number,
    timeout: t.number,
    lastPayment: t.number,
    lastRequest: t.number,
    failedAttempts: t.number,
    subscriptionId: t.number
});
const subscriptionsStateStorage = t.type({
    updatedAt: t.number,
    subscriptions: t.array(subscriptionStateStorage)
});