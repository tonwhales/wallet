import BN from "bn.js";
import { Address, beginCell, TupleSlice4 } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { startDependentSync } from "./utils/startDependentSync";

export type StakingPoolState = {
    lt: BN,
    params: {
        minStake: BN,
        depositFee: BN,
        withdrawFee: BN,
        stakeUntil: number,
        receiptPrice: BN,
        poolFee: BN,
    },
    member: {
        balance: BN,
        pendingDeposit: BN,
        pendingWithdraw: BN,
        withdraw: BN
    }
};

export function startStakingPoolSync(member: Address, pool: Address, engine: Engine) {
    let key = `${member.toFriendly({ testOnly: AppConfig.isTestnet })}/staking/${pool.toFriendly({ testOnly: AppConfig.isTestnet })}`;
    let lite = engine.persistence.liteAccounts.item(pool);
    let item = engine.persistence.staking.item({ address: pool, target: member });

    startDependentSync(key, lite, engine, async (parent) => {

        // Existing state
        let src = item.value;

        // Check parent
        if (!parent.last) {
            return;
        }

        // Check updated
        if (src && new BN(src.lt).gte(parent.last.lt)) {
            return;
        }

        // Fetch fresh state
        const [statusResponse, paramsResponse, memberResponse] = await Promise.all([
            engine.client4.runMethod(parent.block, pool, 'get_staking_status'),
            engine.client4.runMethod(parent.block, pool, 'get_params'),
            engine.client4.runMethod(parent.block, pool, 'get_member', [{ type: 'slice', cell: beginCell().storeAddress(member).endCell() }])
        ]);

        // Parse state
        let statusParser = new TupleSlice4(statusResponse.result);
        let status: {
            proxyStakeAt: number,
            proxyStakeUntil: number,
            proxyStakeSent: BN,
            querySent: boolean,
            unlocked: boolean,
            ctxLocked: boolean
        } = {
            proxyStakeAt: statusParser.readNumber(),
            proxyStakeUntil: statusParser.readNumber(),
            proxyStakeSent: statusParser.readBigNumber(),
            querySent: statusParser.readBoolean(),
            unlocked: statusParser.readBoolean(),
            ctxLocked: statusParser.readBoolean()
        };

        // Parse params
        let paramsParser = new TupleSlice4(paramsResponse.result);
        let params: {
            enabled: boolean,
            udpatesEnabled: boolean,
            minStake: BN,
            depositFee: BN,
            withdrawFee: BN,
            poolFee: BN,
            receiptPrice: BN
        } = {
            enabled: paramsParser.readBoolean(),
            udpatesEnabled: paramsParser.readBoolean(),
            minStake: paramsParser.readBigNumber(),
            depositFee: paramsParser.readBigNumber(),
            withdrawFee: paramsParser.readBigNumber(),
            poolFee: paramsParser.readBigNumber(),
            receiptPrice: paramsParser.readBigNumber()
        };

        // Member
        let memberParser = new TupleSlice4(memberResponse.result);
        let memberState: {
            balance: BN;
            pendingWithdraw: BN;
            pendingDeposit: BN;
            withdraw: BN;
        } = {
            balance: memberParser.readBigNumber(),
            pendingDeposit: memberParser.readBigNumber(),
            pendingWithdraw: memberParser.readBigNumber(),
            withdraw: memberParser.readBigNumber()
        };

        // Update
        let newState: StakingPoolState = {
            lt: parent.last.lt,
            member: memberState,
            params: {
                minStake: params.minStake,
                depositFee: params.depositFee,
                withdrawFee: params.withdrawFee,
                stakeUntil: status.proxyStakeUntil,
                receiptPrice: params.receiptPrice,
                poolFee: params.poolFee
            }
        };
        item.update(() => newState);
    });
}