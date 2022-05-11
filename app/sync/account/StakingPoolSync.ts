import BN from "bn.js";
import { Address, beginCell, TupleSlice4 } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { PersistedValueSync } from "../utils/PersistedValueSync";
import { AccountLiteAtom } from "./AccountLiteAtom";

export type StakingPoolState = {
    lt: BN,
    params: {
        minStake: BN,
        depositFee: BN,
        withdrawFee: BN,
        stakeUntil: number,
        receiptPrice: BN
    },
    member: {
        balance: BN,
        pendingDeposit: BN,
        pendingWithdraw: BN,
        withdraw: BN
    }
};

export class StakingPoolSync extends PersistedValueSync<StakingPoolState> {
    readonly engine: Engine;
    readonly member: Address;
    readonly pool: AccountLiteAtom;

    constructor(member: Address, pool: AccountLiteAtom, engine: Engine) {
        super(`staking(${pool.address.toFriendly({ testOnly: AppConfig.isTestnet })}##${member.toFriendly({ testOnly: AppConfig.isTestnet })})`, engine.persistence.staking.item({ address: pool.address, target: member }), engine);
        this.engine = engine;
        this.member = member;
        this.pool = pool;

        // Forward parent
        if (pool.ready) {
            this.invalidate();
        }
        pool.ref.on('ready', () => {
            this.invalidate();
        });
        pool.ref.on('updated', () => {
            this.invalidate();
        });
    }

    protected doSync = async (src: StakingPoolState | null): Promise<StakingPoolState | null> => {

        // Check parent
        const parentValue = this.pool.current;
        if (!parentValue || !parentValue.last) {
            return null;
        }

        // Check updated
        if (src && new BN(src.lt).gte(parentValue.last.lt)) {
            return null;
        }

        // Fetch fresh state
        const [statusResponse, paramsResponse, memberResponse] = await Promise.all([
            this.engine.client4.runMethod(parentValue.block, this.pool.address, 'get_staking_status'),
            this.engine.client4.runMethod(parentValue.block, this.pool.address, 'get_params'),
            this.engine.client4.runMethod(parentValue.block, this.pool.address, 'get_member', [{ type: 'slice', cell: beginCell().storeAddress(this.member).endCell() }])
        ]);

        // Parse state
        let statusParser = new TupleSlice4(statusResponse.result);
        let status: {
            proxyStakeAt: number,
            proxyStakeUntil: number,
            proxyStakeSent: number,
            querySent: boolean,
            unlocked: boolean,
            ctxLocked: boolean
        } = {
            proxyStakeAt: statusParser.readNumber(),
            proxyStakeUntil: statusParser.readNumber(),
            proxyStakeSent: statusParser.readNumber(),
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
        let member: {
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

        return {
            lt: parentValue.last.lt,
            member,
            params: {
                minStake: params.minStake,
                depositFee: params.depositFee,
                withdrawFee: params.withdrawFee,
                stakeUntil: status.proxyStakeUntil,
                receiptPrice: params.receiptPrice
            }
        };
    }
}