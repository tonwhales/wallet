import { Address, Builder, Cell, Contract, ContractProvider, Dictionary, DictionaryValue, SendMode, Sender, beginCell, toNano } from "@ton/core";
import { StakingStatus } from "../engine/api/fetchStakingStatus";

export const EMPTY_PROXY_STATE: ProxyState = {
    proxyStakeAt: 0,
    proxyStakeHeldFor: 0,
    proxyStakeLockFinal: false,
    proxyStakeSent: 0n,
    proxyStakeUntil: 0,
    proxyStoredQueryId: 0n,
    proxyStoredQueryOp: 0,
    proxyStoredQueryStake: 0n
};

export function storeWithdrawUnowned(queryId: bigint, gasLimit: bigint) {
    return (builder: Builder) => {
        return builder.storeUint(622684824, 32).storeUint(queryId, 64).storeCoins(gasLimit);
    };
}

export function storeDeploy(queryId: bigint, gasLimit: bigint) {
    return (builder: Builder) => {
        return builder.storeUint(0x822d8ae, 32).storeUint(queryId, 64).storeCoins(gasLimit);
    };
}

export function storeLiquidDeposit(
    queryId: bigint,
    amount: bigint,
    responseAddress?: Address,
    fwdAmount: bigint = 0n
) {
    return (builder: Builder) => {
        return builder
            .storeUint(2077040623, 32)
            .storeUint(queryId, 64)
            .storeCoins(amount)
            .storeAddress(responseAddress)
            .storeCoins(fwdAmount);
    };
}

export function storeLiquidWithdraw(
    queryId: bigint,
    jettonAmount: bigint,
    responseAddress?: Address
) {
    return (builder: Builder) => {
        return builder
            .storeUint(3665837821, 32)
            .storeUint(queryId, 64)
            .storeCoins(jettonAmount)
            .storeAddress(responseAddress);
    };
}

export function storeLiquidCollect(queryId: bigint, responseAddress?: Address) {
    return (builder: Builder) => {
        return builder
            .storeUint(0x4a10e022, 32)
            .storeUint(queryId, 64)
            .storeAddress(responseAddress);
    };
}

export class LiquidStakingPool implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createFromAddress(address: Address) {
        return new LiquidStakingPool(address);
    }

    async sendDeposit(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        deposit: bigint,
        queryId: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeLiquidDeposit(queryId, deposit, via.address)).endCell()
        });
    }

    async sendWithdraw(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        withdraw: bigint,
        queryId: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeLiquidWithdraw(queryId, withdraw, via.address)).endCell()
        });
    }

    async sendCollect(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        queryId: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().store(storeLiquidCollect(queryId, via.address)).endCell()
        });
    }

    async getState(provider: ContractProvider) {
        let state = await provider.getState();
        if (state.state.type !== 'active' || !state.state.data) {
            return null;
        }

        let ds = Cell.fromBoc(state.state.data)[0].beginParse();
        let owner = ds.loadAddress();
        let controller = ds.loadAddress();
        let lastElectionId = ds.loadUint(32);
        let roundId = ds.loadUint(32);
        let prevRoundPpc = ds.loadCoins();

        let bs = ds.loadRef().beginParse();
        let ms = ds.loadRef().beginParse();
        let ps = ds.loadRef().beginParse();

        ps.skip(8);
        let proxyZero = ps.loadAddress();
        let proxyOne = ps.loadAddress();
        let proxies = ps.loadDict(Dictionary.Keys.Uint(1), ProxyDictionaryValue);

        let extras: {
            enabled: boolean;
            upgradable: boolean;
            minStake: bigint;
            depositFee: bigint;
            withdrawFee: bigint;
            poolFee: bigint;
            receiptPrice: bigint;
        } = {
            enabled: true,
            upgradable: true,
            minStake: toNano('49.8'),
            depositFee: toNano('0.1'),
            withdrawFee: toNano('0.1'),
            poolFee: 10n * 100n,
            receiptPrice: toNano('0.1')
        };

        if (ds.remainingRefs > 0) {
            let es = ds.loadRef().beginParse();
            extras.enabled = es.loadBoolean();
            extras.upgradable = es.loadBoolean();
            extras.minStake = es.loadCoins();
            extras.depositFee = es.loadCoins();
            extras.withdrawFee = es.loadCoins();
            extras.poolFee = es.loadCoins();
        }

        let balances = {
            balance: bs.loadCoins(),
            balanceSent: bs.loadCoins(),
            balanceWithdraw: bs.loadCoins(),
            balancePendingWithdraw: bs.loadCoins()
        };

        let minter = {
            totalSupply: ms.loadCoins(),
            content: ms.loadRef(),
            walletCode: ms.loadRef()
        };

        return {
            data: {
                owner,
                controller,
                proxyZero,
                proxyOne,
                lastElectionId,
                roundId,
                proxies: proxies,
                balances,
                extras,
                minter
            },
            balance: state.balance
        };
    }

    async getPoolStatus(
        provider: ContractProvider,
        address: Address,
        status: StakingStatus,
        isTestnet: boolean
    ) {
        let poolState = await provider.get('get_pool_status', []);

        let rateDeposit = poolState.stack.readBigNumber();
        let rateWithdraw = poolState.stack.readBigNumber();

        let roundId = poolState.stack.readNumber();
        // let extras = poolState.stack.readTuple();
        // let balances = poolState.stack.readTuple();

        const stakeUntil0 = (
            (await this.getState(provider))?.data.proxies.get(0) ?? EMPTY_PROXY_STATE
        ).proxyStakeUntil;
        const stakeUntil1 = (
            (await this.getState(provider))?.data.proxies.get(1) ?? EMPTY_PROXY_STATE
        ).proxyStakeUntil;

        let startElection = status.startWorkTime - status.electorsStartBefore;
        let startNextElection = startElection + status.validatorsElectedFor;

        let roundEnd = startNextElection / 1000;

        if (roundEnd * 1000 - Date.now() < 0) {
            roundEnd = roundEnd + (isTestnet ? 2 * 60 * 60 : 18.6 * 60 * 60);
        }

        return {
            rateDeposit,
            rateWithdraw,
            roundId,
            extras: {
                enabled: poolState.stack.readBoolean(),
                upgradable: poolState.stack.readBoolean(),
                minStake: poolState.stack.readBigNumber(),
                depositFee: poolState.stack.readBigNumber(),
                withdrawFee: poolState.stack.readBigNumber(),
                receiptPrice: poolState.stack.readBigNumber(),
                poolFee: poolState.stack.readNumber(),
                address,
                roundEnd,
                proxyZeroStakeUntil: stakeUntil0,
                proxyOneStakeUntil: stakeUntil1
            },
            balances: {
                minterSupply: poolState.stack.readBigNumber(),
                totalBalance: poolState.stack.readBigNumber(),
                totalSent: poolState.stack.readBigNumber(),
                totalPendingWithdraw: poolState.stack.readBigNumber(),
                totalBalanceWithdraw: poolState.stack.readBigNumber()
            }
        };
    }

    async getTonBalance(provider: ContractProvider, jettonBalance: bigint) {
        let tonBalance = await provider.get('get_ton_balance', [
            { type: 'int', value: jettonBalance }
        ]);
        return tonBalance.stack.readBigNumber();
    }

    async getUnowned(provider: ContractProvider) {
        let tonBalance = await provider.get('get_unowned', []);
        return tonBalance.stack.readBigNumber();
    }

    async getWalletAddress(provider: ContractProvider, address: Address) {
        let memberAddress = await provider.get('get_wallet_address', [
            { type: 'slice', cell: beginCell().storeAddress(address).endCell() }
        ]);
        return memberAddress.stack.readAddress();
    }

    static createWithdrawUnowned(queryId: bigint, gasLimit: bigint) {
        return beginCell().store(storeWithdrawUnowned(queryId, gasLimit)).endCell();
    }
}

// Hack to infer type of DictionaryValue
function createDictionaryValue<T>(value: DictionaryValue<T>) {
    return value;
}
export const ProxyDictionaryValue = createDictionaryValue({
    parse: (src) => {
        let proxyStakeAt = src.loadUint(32);
        let proxyStakeUntil = src.loadUint(32);
        let proxyStakeSent = src.loadCoins();
        let proxyStoredQueryId = src.loadUintBig(64);
        let proxyStoredQueryOp = src.loadUint(32);
        let proxyStoredQueryStake = src.loadCoins();
        let proxyStakeHeldFor = 0;
        let proxyStakeLockFinal = false;
        if (src.remainingBits >= 32) {
            proxyStakeHeldFor = src.loadUint(32);
            if (src.remainingBits >= 1) {
                proxyStakeLockFinal = src.loadBoolean();
            }
        }
        src.endParse();

        return {
            proxyStakeAt,
            proxyStakeUntil,
            proxyStakeSent,
            proxyStoredQueryId,
            proxyStoredQueryOp,
            proxyStoredQueryStake,
            proxyStakeHeldFor,
            proxyStakeLockFinal
        };
    },
    serialize: (src, builder) => {
        builder.storeUint(src.proxyStakeAt, 32);
        builder.storeUint(src.proxyStakeUntil, 32);
        builder.storeCoins(src.proxyStakeSent);
        builder.storeUint(src.proxyStoredQueryId, 64);
        builder.storeUint(src.proxyStoredQueryOp, 32);
        builder.storeUint(src.proxyStakeHeldFor, 32);
        builder.storeBit(src.proxyStakeLockFinal);
    }
});

export type ProxyState = ReturnType<typeof ProxyDictionaryValue.parse>;
