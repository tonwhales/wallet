import BN from "bn.js";
import { Address, beginCell, Cell, fromNano, Slice, TonClient4, TupleSlice4 } from "ton";
import { AppConfig } from "../../AppConfig";
import { backoff } from "../../utils/time";
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
        locked: boolean
    },
    member: {
        balance: BN,
        pendingDeposit: BN,
        pendingWithdraw: BN,
        withdraw: BN
    }
};

export type StakingChart = {
    chart: {
        balance: string;
        ts: number;
        diff: string;
    }[];
    lastUpdate: number;
}

async function getStakingMemberMonthlyChart(client4: TonClient4, address: Address, pool: Address) {
    let fromTs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    fromTs = Math.floor(fromTs / 1000);

    let tillTs = Math.floor(Date.now() / 1000) - 60;
    let keyTimePoints: number[] = [];
    for (let ts = tillTs; ts > fromTs; ts -= 60 * 60 * 36) {
        keyTimePoints.push(ts);
    }

    let keyBlocks = await Promise.all(keyTimePoints.map(async (ts) => ({ block: await client4.getBlockByUtime(ts), ts })));
    let chaoticPoints = await Promise.all(keyBlocks.map(async block => {
        let result = await client4.runMethod(block.block.shards[0].seqno, pool, 'get_member', [{
            type: 'slice',
            cell: beginCell().storeAddress(address).endCell(),
        }]);
        if (result.result[0]?.type === 'int') {
            return { ts: block.ts, balance: result.result[0].value };
        }
        return null;
    }));
    let points = chaoticPoints.filter(a => a !== null) as { ts: number, balance: BN }[];
    points = points.sort((a, b) => a.ts - b.ts);

    const chart: { balance: string, ts: number, diff: string }[] = []
    let prevBalance = new BN(1);

    for (let point of points) {
        chart.push({
            balance: point.balance.toString(10),
            ts: point.ts * 1000,
            diff: point.balance.sub(new BN(prevBalance)).toString(10)
        });

        prevBalance = point.balance;
    }

    const lastUpdate = Date.now();

    return { chart, lastUpdate };
}

export async function downloadStateDirectly(engine: Engine, address: Address) {
    let last = await engine.client4.getLastBlock();
    let data = await engine.client4.getAccount(last.last.seqno, address);

    if (data.account.state.type !== 'active') {
        throw Error('Invalid state');
    }
    return Cell.fromBoc(Buffer.from(data.account.state.data!, 'base64'))[0];
}

export function startStakingPoolSync(member: Address, pool: Address, engine: Engine) {
    let key = `${member.toFriendly({ testOnly: AppConfig.isTestnet })}/staking/${pool.toFriendly({ testOnly: AppConfig.isTestnet })}`;
    let lite = engine.persistence.liteAccounts.item(pool);
    let item = engine.persistence.staking.item({ address: pool, target: member });
    let chartItem = engine.persistence.stakingChart.item({ address: pool, target: member });

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
            engine.client4.runMethod(parent.block, pool, 'get_member', [{ type: 'slice', cell: beginCell().storeAddress(member).endCell() }]),
        ]);

        // Parse state
        let statusParser = new TupleSlice4(statusResponse.result);
        let status: {
            proxyStakeAt: number,
            proxyStakeUntil: number,
            proxyStakeSent: BN,
            querySent: boolean,
            canUnlock: boolean,
            locked: boolean,
            proxyStakeLockFinal: boolean,
        } = {
            proxyStakeAt: statusParser.readNumber(),
            proxyStakeUntil: statusParser.readNumber(),
            proxyStakeSent: statusParser.readBigNumber(),
            querySent: statusParser.readBoolean(),
            canUnlock: statusParser.readBoolean(),
            locked: statusParser.readBoolean(),
            proxyStakeLockFinal: statusParser.readBoolean(),
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
        console.log({ key, memberResponse: JSON.stringify(memberResponse.result), pool: pool.toFriendly({ testOnly: AppConfig.isTestnet }) });

        let memberState: {
            balance: BN;
            pendingWithdraw: BN;
            pendingDeposit: BN;
            withdraw: BN;
        }
        if (memberResponse.result.length < 4) {
            memberState = {
                balance: new BN(0),
                pendingDeposit: new BN(0),
                pendingWithdraw: new BN(0),
                withdraw: new BN(0)
            };
        }
        memberState = {
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
                poolFee: params.poolFee,
                locked: status.locked
            }
        };
        item.update(() => newState);

        if (Date.now() - (chartItem.value?.lastUpdate || 0) < 60 * 60 * 1000) { // syncing every hour
            return;
        }

        const newChartState = await backoff('graph', () => getStakingMemberMonthlyChart(engine.client4, member, pool));

        if (newChartState) {
            chartItem.update(() => newChartState);
        }
    });
}