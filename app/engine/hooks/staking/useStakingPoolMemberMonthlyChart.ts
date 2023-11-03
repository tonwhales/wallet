import { useQuery } from '@tanstack/react-query';
import { Address, TonClient4, beginCell } from '@ton/ton';
import { Queries } from '../../queries';

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

    let points = chaoticPoints.filter(a => a !== null) as { ts: number, balance: bigint }[];
    points = points.sort((a, b) => a.ts - b.ts);

    const chart: { balance: string, ts: number, diff: string }[] = []
    let prevBalance = BigInt(1);

    for (let point of points) {
        chart.push({
            balance: point.balance.toString(10),
            ts: point.ts * 1000,
            diff: (point.balance - prevBalance).toString(10)
        });

        prevBalance = point.balance;
    }

    const lastUpdate = Date.now();

    return { chart, lastUpdate };
}

function stakingMemberMonthlyChartQueryFn(client: TonClient4, address: Address, pool: Address) {
    return async () => {
        return await getStakingMemberMonthlyChart(client, address, pool);
    }
}

export function useStakingPoolMemberMonthlyChart(client: TonClient4, pool: Address, address: Address) {
    return useQuery({
        queryFn: stakingMemberMonthlyChartQueryFn(client, address, pool),
        queryKey: Queries.Account(pool.toString()).StakingPool().Chart(address.toString()),
    }).data;
}