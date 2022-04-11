import BN from 'bn.js';
import { Address, Cell } from "ton";
import { AppConfig } from '../AppConfig';
import { backoff } from '../utils/time';
import { getCurrentAddress } from '../storage/appState';
import { tonClient } from '../utils/client';

export interface StakingPoolData {
    name: string,
    address: Address,
    params: {
        minStake: BN,
        depositFee: BN,
        withdrawFee: BN,
        stakeUntil: number,
    },
    member: { balance: BN, pendingDeposit: BN, pendingWithdraw: BN, withdraw: BN } | null
}

const endpoints = AppConfig.isTestnet ? [{
    name: '[TESTNET] Whales Nominator Pool #2',
    pool: Address.parse('kQBs7t3uDYae2Ap4686Bl4zGaPKvpbauBnZO_WSop1whaLEs')
}] : [{
    name: 'Whales Nominators #1',
    pool: Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales')
}];

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

export async function fetchStakingPool(): Promise<StakingPoolData[]> {
    return Promise.all(endpoints.map(async (v) => {
        let address = getCurrentAddress().address;

        let [statusRaw, paramsRaw, memberRaw] = await Promise.all([
            backoff(() => tonClient.callGetMethod(v.pool, 'get_staking_status', [])),
            backoff(() => getPoolParams(v.pool)),
            backoff(() => getMember(v.pool, address))
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

        console.log({ member, poolParams, statusRes });

        return {
            name: v.name,
            address: v.pool,
            member: member ? member : null,
            params: {
                minStake: poolParams.minStake,
                depositFee: poolParams.depositFee,
                withdrawFee: poolParams.withdrawFee,
                stakeUntil: status.proxyStakeUntil,
            }
        }
    }));
}