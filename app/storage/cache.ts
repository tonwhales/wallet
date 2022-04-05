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

const stakingPoolStateStorage = t.type({
    name: t.string,
    address: t.string,
    proxy: t.string,
    owner: t.string,
    controller: t.string,
    contractBalance: t.string,
    balance: t.string,
    balanceSent: t.string,
    balancePendingDeposits: t.string,
    balancePendingWithdrawals: t.string,
    balanceWithdrawals: t.string,
    locked: t.boolean,
    readyToUnlock: t.boolean,
    enabled: t.boolean,
    upgradesEnabled: t.boolean,
    minStake: t.string,
    depositFee: t.string,
    withdrawFee: t.string,
    receiptPrice: t.string,
    poolFee: t.number,
    validatorWeight: t.number,
    validatorBonuses: t.string,
    balanceDrift: t.string,
    stakeUntil: t.number,
    members: t.array(t.type({
        address: t.string,
        balance: t.string,
        pendingDeposit: t.string,
        pendingWithdraw: t.string,
        withdraw: t.string
    }))
})

function serializeStakingPool(stakingPool: StakingPoolState): t.TypeOf<typeof stakingPoolStateStorage> {
    return {
        name: stakingPool.name,
        address: stakingPool.address.toFriendly({ testOnly: AppConfig.isTestnet }),
        proxy: stakingPool.proxy.toFriendly({ testOnly: AppConfig.isTestnet }),
        owner: stakingPool.owner.toFriendly({ testOnly: AppConfig.isTestnet }),
        controller: stakingPool.controller.toFriendly({ testOnly: AppConfig.isTestnet }),
        contractBalance: stakingPool.contractBalance.toString(10),
        balance: stakingPool.balance.toString(10),
        balanceSent: stakingPool.balanceSent.toString(10),
        balancePendingDeposits: stakingPool.balancePendingDeposits.toString(10),
        balancePendingWithdrawals: stakingPool.balancePendingWithdrawals.toString(10),
        balanceWithdrawals: stakingPool.balanceWithdrawals.toString(10),
        locked: stakingPool.locked,
        readyToUnlock: stakingPool.readyToUnlock,
        enabled: stakingPool.enabled,
        upgradesEnabled: stakingPool.upgradesEnabled,
        minStake: stakingPool.minStake.toString(10),
        depositFee: stakingPool.depositFee.toString(10),
        withdrawFee: stakingPool.withdrawFee.toString(10),
        receiptPrice: stakingPool.receiptPrice.toString(10),
        poolFee: stakingPool.poolFee,
        validatorWeight: stakingPool.validatorWeight,
        validatorBonuses: stakingPool.validatorBonuses.toString(10),
        balanceDrift: stakingPool.balanceDrift.toString(10),
        stakeUntil: stakingPool.stakeUntil,
        members: stakingPool.members.map((m) => {
            return {
                address: m.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                balance: m.balance.toString(10),
                pendingDeposit: m.pendingDeposit.toString(10),
                pendingWithdraw: m.pendingWithdraw.toString(10),
                withdraw: m.withdraw.toString(10)
            }
        })
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
        proxy: Address.parseFriendly(stored.proxy).address,
        owner: Address.parseFriendly(stored.owner).address,
        controller: Address.parseFriendly(stored.controller).address,
        contractBalance: new BN(stored.contractBalance, 10),
        balance: new BN(stored.balance, 10),
        balanceSent: new BN(stored.balanceSent, 10),
        balancePendingDeposits: new BN(stored.balancePendingDeposits, 10),
        balancePendingWithdrawals: new BN(stored.balancePendingWithdrawals, 10),
        balanceWithdrawals: new BN(stored.balanceWithdrawals, 10),
        locked: stored.locked,
        readyToUnlock: stored.readyToUnlock,
        enabled: stored.enabled,
        upgradesEnabled: stored.upgradesEnabled,
        minStake: new BN(stored.minStake, 10),
        depositFee: new BN(stored.depositFee, 10),
        withdrawFee: new BN(stored.withdrawFee, 10),
        receiptPrice: new BN(stored.receiptPrice, 10),
        poolFee: stored.poolFee,
        validatorWeight: stored.validatorWeight,
        validatorBonuses: new BN(stored.validatorBonuses, 10),
        balanceDrift: new BN(stored.balanceDrift, 10),
        stakeUntil: stored.stakeUntil,
        members: stored.members.map((m) => {
            return { 
                address: Address.parseFriendly(m.address).address, 
                balance: new BN(m.balance, 10), 
                pendingDeposit: new BN(m.pendingDeposit, 10), 
                pendingWithdraw: new BN(m.pendingWithdraw, 10), 
                withdraw: new BN(m.withdraw, 10) 
            }
        })
    };
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

export type StakingPoolState = {
    name: string,
    address: Address,
    proxy: Address,
    owner: Address,
    controller: Address,
    contractBalance: BN,
    balance: BN,
    balanceSent: BN,
    balancePendingDeposits: BN,
    balancePendingWithdrawals: BN,
    balanceWithdrawals: BN,
    locked: boolean,
    readyToUnlock: boolean,
    enabled: boolean,
    upgradesEnabled: boolean,
    minStake: BN,
    depositFee: BN,
    withdrawFee: BN,
    receiptPrice: BN,
    poolFee: number,
    validatorWeight: number,
    validatorBonuses: BN,
    balanceDrift: BN,
    stakeUntil: number,
    members: { address: Address, balance: BN, pendingDeposit: BN, pendingWithdraw: BN, withdraw: BN }[]
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
        storeStakingPool: (stakingPool: StakingPoolState) => {
            const serialized = JSON.stringify(serializeStakingPool(stakingPool));
            store.set('staking_pool_', serialized);
        },
        loadStakingPool: () => {
            let stakingPool = store.getString('staking_pool_');
            if (stakingPool) {
                return parseStakingPoolState(JSON.parse(stakingPool));
            } else {
                return null;
            }
        },
    };
}