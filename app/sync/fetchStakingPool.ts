import BN from 'bn.js';
import { Address, Cell } from "ton";
import { backoff } from '../utils/time';
import { Engine } from './Engine';
import { StakingPoolState } from './products/StakingPoolProduct';

export function bnToAddress(bn: BN) {
    let r = bn.toString("hex");
    while (r.length < 64) {
        r = "0" + r;
    }
    return new Address(0, Buffer.from(r, "hex"));
}
export class TupleSlice {
    private readonly items: any[];
    constructor(items: any[]) {
        this.items = [...items];
    }

    readNumber() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let res = parseInt(this.items[0][1]);
        this.items.splice(0, 1);
        return res;
    }

    readBoolean() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let res = parseInt(this.items[0][1]);
        this.items.splice(0, 1);
        return res === 0 ? false : true;
    }

    readBigNumber() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let res = new BN((this.items[0][1] as string).slice(2), 'hex');
        this.items.splice(0, 1);
        return res;
    }

    readCell() {
        if (this.items[0][0] !== 'cell') {
            throw Error('Not a cell');
        }
        let res = Cell.fromBoc(Buffer.from(this.items[0][1].bytes as string, 'base64'))[0];
        this.items.splice(0, 1);
        return res;
    }

    readWorkchainAddress() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let bn = this.readBigNumber();
        return bnToAddress(bn);
    }
}

export async function getMember(engine: Engine, pool: Address, address: Address) {
    const cell = new Cell();
    cell.bits.writeAddress(address);
    return await engine.connector.client.callGetMethod(pool, 'get_member', [[
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

export async function getPoolParams(engine: Engine, pool: Address) {
    return engine.connector.client.callGetMethod(pool, 'get_params', []);
}

export async function fetchStakingPool(engine: Engine, pool: Address, target: Address): Promise<StakingPoolState> {
    let [statusRaw, paramsRaw, memberRaw] = await Promise.all([
        backoff(() => engine.connector.client.callGetMethod(pool, 'get_staking_status', [])),
        backoff(() => getPoolParams(engine, pool)),
        backoff(() => getMember(engine, pool, target))
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
        member: member,
        params: {
            minStake: poolParams.minStake,
            depositFee: poolParams.depositFee,
            withdrawFee: poolParams.withdrawFee,
            stakeUntil: status.proxyStakeUntil,
            receiptPrice: poolParams.receiptPrice
        }
    }
}