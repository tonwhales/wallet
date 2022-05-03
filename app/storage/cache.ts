import { Address, Cell } from "ton";
import * as t from 'io-ts';
import BN from "bn.js";
import { isLeft } from "fp-ts/lib/Either";
import { MMKV } from "react-native-mmkv";
import { AppConfig } from "../AppConfig";

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

//
// Price
//

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
// Staking Pool
// 

const stakingPoolStateStorage = t.type({
    name: t.string,
    address: t.string,
    params: t.type({
        minStake: t.string,
        depositFee: t.string,
        withdrawFee: t.string,
        stakeUntil: t.number,
        receiptPrice: t.string
    }),
    member: t.union([
        t.type({
            balance: t.string,
            pendingDeposit: t.string,
            pendingWithdraw: t.string,
            withdraw: t.string
        }),
        t.null
    ])
})

function serializeStakingPool(stakingPool: StakingPoolState): t.TypeOf<typeof stakingPoolStateStorage> {
    return {
        name: stakingPool.name,
        address: stakingPool.address.toFriendly({ testOnly: AppConfig.isTestnet }),
        params: {
            minStake: stakingPool.params.minStake.toString(10),
            depositFee: stakingPool.params.depositFee.toString(10),
            withdrawFee: stakingPool.params.withdrawFee.toString(10),
            stakeUntil: stakingPool.params.stakeUntil,
            receiptPrice: stakingPool.params.receiptPrice.toString(10)
        },
        member: stakingPool.member ? {
            balance: stakingPool.member.balance.toString(10),
            pendingDeposit: stakingPool.member.pendingDeposit.toString(10),
            pendingWithdraw: stakingPool.member.pendingWithdraw.toString(10),
            withdraw: stakingPool.member.withdraw.toString(10)
        } : null
    }
}

function parseStakingPoolState(src: any): StakingPoolState | null {
    const parsed = stakingPoolStateStorage.decode(src);
    if (isLeft(parsed)) {
        return null;
    }
    const stored = parsed.right;
    return {
        name: stored.name,
        address: Address.parseFriendly(stored.address).address,
        params: {
            minStake: new BN(stored.params.minStake, 10),
            depositFee: new BN(stored.params.depositFee, 10),
            withdrawFee: new BN(stored.params.withdrawFee, 10),
            stakeUntil: stored.params.stakeUntil,
            receiptPrice: new BN(stored.params.receiptPrice, 10)
        },
        member: stored.member ? {
            balance: new BN(stored.member.balance, 10),
            pendingDeposit: new BN(stored.member.pendingDeposit, 10),
            pendingWithdraw: new BN(stored.member.pendingWithdraw, 10),
            withdraw: new BN(stored.member.withdraw, 10)
        } : null
    };
}

// 
// Subscriptions
// 

const subscribtionsStateStorage = t.type({
    updatedAt: t.number,
    subscriptions: t.array(t.type({ address: t.string }))
});

function serializeSubscribtions(data: SubscriptionsStateData): t.TypeOf<typeof subscribtionsStateStorage> {
    return {
        updatedAt: data.updatedAt,
        subscriptions: data.subscriptions.map((s) => {
            return {
                address: s.address.toFriendly({ testOnly: AppConfig.isTestnet })
            }
        })
    }
}

function parseSubscribtions(src: any): SubscriptionsStateData | null {
    const parsed = subscribtionsStateStorage.decode(src);
    if (isLeft(parsed)) {
        return null;
    }
    const stored = parsed.right;
    return {
        updatedAt: stored.updatedAt,
        subscriptions: stored.subscriptions.map((s) => {
            return {
                address: Address.parseFriendly(s.address).address,
            }
        })
    }
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

export type StakingPoolState = {
    name: string,
    address: Address,
    params: {
        minStake: BN,
        depositFee: BN,
        withdrawFee: BN,
        stakeUntil: number,
        receiptPrice: BN
    },
    member: { balance: BN, pendingDeposit: BN, pendingWithdraw: BN, withdraw: BN } | null
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
        storeJob: (address: Address, state: string | null) => {
            if (state) {
                store.set('job_' + address.toFriendly({ testOnly: AppConfig.isTestnet }), state);
            } else {
                store.delete('job_' + address.toFriendly({ testOnly: AppConfig.isTestnet }));
            }
        },
        loadJob: (address: Address) => {
            let s = store.getString('job_' + address.toFriendly({ testOnly: AppConfig.isTestnet }));
            if (s) {
                return s;
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
        },
        storeStakingPool: (stakingPool: StakingPoolState, address: Address) => {
            const serialized = JSON.stringify(serializeStakingPool(stakingPool));
            store.set('staking_pool_' + address.toFriendly({ testOnly: AppConfig.isTestnet }), serialized);
        },
        loadStakingPool: (address: Address) => {
            let stakingPool = store.getString('staking_pool_' + address.toFriendly({ testOnly: AppConfig.isTestnet }));
            if (stakingPool) {
                return parseStakingPoolState(JSON.parse(stakingPool));
            } else {
                return null;
            }
        },
        loadSupportedInterfaces: (address: Address) => {
            let supportedInterfaces = store.getString('supported_interfaces_' + address.toFriendly({ testOnly: AppConfig.isTestnet }));
            if (supportedInterfaces) {
                return JSON.parse(supportedInterfaces) as string[];
            } else {
                return null;
            }
        },
        storeSupportedInterfaces: (address: Address, supportedInterfaces: string[]) => {
            store.set('supported_interfaces_' + address.toFriendly({ testOnly: AppConfig.isTestnet }), JSON.stringify(supportedInterfaces));
        },
        storeSubscriptions: (data: SubscriptionsStateData) => {
            console.log('storeSubscriptions', { data })
            const serialized = JSON.stringify(serializeSubscribtions(data));
            store.set('subscriptions_state', serialized);
        },
        loadSubscriptions: () => {
            let res = store.getString('subscriptions_state');
            if (res) {
                return parseSubscribtions(JSON.parse(res));
            } else {
                return null
            }
        }
    };
}