import BN from 'bn.js';
import { Address, Cell, TonClient } from "ton";
import { AppConfig } from '../AppConfig';
import { ElectorContract } from "ton-contracts";
import { backoff } from '../utils/time';
import { tonClient } from '../utils/client';

export interface StakingPoolData {
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

const endpoints = AppConfig.isTestnet ? [{
    name: '[TESTNET] Whales Nominator Pool #2',
    pool: Address.parse('kQBs7t3uDYae2Ap4686Bl4zGaPKvpbauBnZO_WSop1whaLEs')
}] : [{
    name: 'Whales Nominators #1',
    pool: Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales')
}];

function parseHex(src: string): BN {
    if (src.startsWith('-')) {
        let res = parseHex(src.slice(1));
        return res.neg();
    }
    return new BN(src.slice(2), 'hex');
}

function loadNum(src: any) {
    if (src[0] !== 'num') {
        throw Error('Invalid num');
    }
    return parseHex(src[1]);
}

export async function fetchStakingPool(): Promise<StakingPoolData[]> {
    return Promise.all(endpoints.map(async (v) => {
        let [state, status, stakingStatus, response, stakingParams, proxyResp, ownerResp, controllerResp, elections, configs] = await Promise.all([
            backoff(() => tonClient.getContractState(v.pool)),
            backoff(() => tonClient.callGetMethod(v.pool, 'get_pool_status', [])),
            backoff(() => tonClient.callGetMethod(v.pool, 'get_staking_status', [])),
            backoff(() => tonClient.callGetMethod(v.pool, 'get_members', [])),
            backoff(() => tonClient.callGetMethod(v.pool, 'get_params', [])),
            backoff(() => tonClient.callGetMethod(v.pool, 'get_proxy', [])),
            backoff(() => tonClient.callGetMethod(v.pool, 'get_owner', [])),
            backoff(() => tonClient.callGetMethod(v.pool, 'get_controller', [])),
            backoff(() => new ElectorContract(tonClient).getPastElections()),
            backoff(() => tonClient.services.configs.getConfigs()),
        ]);

        let proxy = Cell.fromBoc(Buffer.from(proxyResp.stack[0][1].bytes, 'base64'))[0].beginParse().readAddress()!;
        let owner = Cell.fromBoc(Buffer.from(ownerResp.stack[0][1].bytes, 'base64'))[0].beginParse().readAddress()!;
        let controller = Cell.fromBoc(Buffer.from(controllerResp.stack[0][1].bytes, 'base64'))[0].beginParse().readAddress()!;

        let balance = loadNum(status.stack[0]);
        let balanceSent = loadNum(status.stack[1]);
        let balancePendingDeposits = loadNum(status.stack[2]);
        let balancePendingWithdrawals = loadNum(status.stack[3]);
        let balanceWithdrawals = loadNum(status.stack[4]);

        let stakeAt = loadNum(stakingStatus.stack[0]);
        let stakeUntil = loadNum(stakingStatus.stack[1]).toNumber();
        let stakeSent = loadNum(stakingStatus.stack[2]);
        let querySent = loadNum(stakingStatus.stack[3]);
        let readyToUnlock = loadNum(stakingStatus.stack[4]).toNumber() === -1;
        let locked = loadNum(stakingStatus.stack[5]).toNumber() === -1;

        let enabled = loadNum(stakingParams.stack[0]).toNumber() === -1;
        let upgradesEnabled = loadNum(stakingParams.stack[1]).toNumber() === -1;
        let minStake = loadNum(stakingParams.stack[2]);
        let depositFee = loadNum(stakingParams.stack[3]);
        let withdrawFee = loadNum(stakingParams.stack[4]);
        let poolFee = loadNum(stakingParams.stack[5]).toNumber() / 100;
        let receiptPrice = loadNum(stakingParams.stack[6]);

        // Find current bonuses
        let ex = elections.find((v) => v.id === configs.validatorSets.currentValidators!.timeSince)!;
        let bonuses = ex.bonuses;
        let weight = new BN(0);
        let totalWeight = configs.validatorSets.currentValidators!.totalWeight!;
        for (let key of configs.validatorSets.currentValidators!.list!.keys()) {
            let val = configs.validatorSets.currentValidators!.list!.get(key)!;
            let frozen = ex.frozen.get(new BN(val.publicKey, 'hex').toString());
            if (frozen && frozen.address.equals(proxy)) {
                weight = weight.add(val.weight);
            }
        }

        let validatorWeight = weight.mul(new BN(1000000)).div(totalWeight).toNumber() / 1000000;
        let validatorBonuses = bonuses.mul(weight.mul(new BN(1000000)).div(totalWeight)).div(new BN(1000000));

        // Members
        let res = response.stack[0][1].elements as { tuple: any[] }[];
        let membersBalances = new BN(0);
        let members: { address: Address, balance: BN, pendingDeposit: BN, pendingWithdraw: BN, withdraw: BN }[] = [];
        for (let r of res) {
            let address = Cell.fromBoc(Buffer.from((r.tuple as any).elements[0].cell.bytes, 'base64'))[0]
                .beginParse()
                .readAddress()!;

            let b = new BN((r.tuple as any).elements[1].number.number);
            membersBalances = membersBalances.add(b);
            members.push({
                address,
                balance: b,
                pendingDeposit: new BN((r.tuple as any).elements[2].number.number),
                pendingWithdraw: new BN((r.tuple as any).elements[3].number.number),
                withdraw: new BN((r.tuple as any).elements[4].number.number)
            });
        }

        let balanceDrift = balance.sub(membersBalances);

        return {
            name: v.name,
            address: v.pool,
            proxy,
            owner,
            controller,
            contractBalance: state.balance,
            balance,
            balanceSent,
            balancePendingDeposits,
            balancePendingWithdrawals,
            balanceWithdrawals,
            members,
            readyToUnlock,
            locked,
            enabled,
            upgradesEnabled,
            minStake,
            depositFee,
            withdrawFee,
            poolFee,
            receiptPrice,
            validatorWeight,
            validatorBonuses,
            balanceDrift,
            stakeUntil
        }
    }));
}