import BN from 'bn.js';
import { Address, Cell } from "ton";
import { AppConfig } from '../AppConfig';
import { backoff } from '../utils/time';
import { getCurrentAddress } from '../storage/appState';
import { tonClient } from '../utils/client';
import { TupleSlice } from '../utils/TupleSlice';

export interface StakingPoolData {
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

export async function getMember(pool: Address, address: Address) {
    const cell = new Cell();
    cell.bits.writeAddress(address);
    return tonClient.callGetMethod(pool, 'get_member', [[
        'slice',
        JSON.stringify(
            {
                data: {
                    b64: cell.bits.getTopUppedArray().toString('base64'),
                    len: 267
                },
                refs: []
            }
        )
    ]]);
}

export async function getPoolParams(pool: Address) {
    return tonClient.callGetMethod(pool, 'get_params', []);
}

export async function fetchStakingPool(pool: Address, name: string): Promise<StakingPoolData> {
    let address = getCurrentAddress().address;

    let [statusRaw, paramsRaw, memberRaw] = await Promise.all([
        backoff(() => tonClient.callGetMethod(pool, 'get_staking_status', [])),
        backoff(() => getPoolParams(pool)),
        backoff(() => getMember(pool, address))
    ]);

    let paramsRes = new TupleSlice(paramsRaw.stack);
    let memberRes = new TupleSlice(memberRaw.stack);
    let statusRes = new TupleSlice(statusRaw.stack);

    let member: {
        balance: BN;
        pendingWithdraw: BN;
        pendingDeposit: BN;
        withdraw: BN;
    } = {
        balance: memberRes.readBigNumber(),
        pendingDeposit: memberRes.readBigNumber(),
        pendingWithdraw: memberRes.readBigNumber(),
        withdraw: memberRes.readBigNumber()
    }

    let poolParams: {
        enabled: boolean,
        udpatesEnabled: boolean,
        minStake: BN,
        depositFee: BN,
        withdrawFee: BN,
        poolFee: BN,
        receiptPrice: BN
    } = {
        enabled: paramsRes.readBoolean(),
        udpatesEnabled: paramsRes.readBoolean(),
        minStake: paramsRes.readBigNumber(),
        depositFee: paramsRes.readBigNumber(),
        withdrawFee: paramsRes.readBigNumber(),
        poolFee: paramsRes.readBigNumber(),
        receiptPrice: paramsRes.readBigNumber()
    }

    let status: {
        proxyStakeAt: number,
        proxyStakeUntil: number,
        proxyStakeSent: number,
        querySent: number,
        unlocked: number,
        ctxLocked: number
    } = {
        proxyStakeAt: statusRes.readNumber(),
        proxyStakeUntil: statusRes.readNumber(),
        proxyStakeSent: statusRes.readNumber(),
        querySent: statusRes.readNumber(),
        unlocked: statusRes.readNumber(),
        ctxLocked: statusRes.readNumber()
    }

    return {
        name: name,
        address: pool,
        member: member ? member : null,
        params: {
            minStake: poolParams.minStake,
            depositFee: poolParams.depositFee,
            withdrawFee: poolParams.withdrawFee,
            stakeUntil: status.proxyStakeUntil,
            receiptPrice: poolParams.receiptPrice
        }
    }
}