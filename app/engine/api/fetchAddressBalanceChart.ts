import { Address, TonClient4, toNano } from "@ton/ton";

export async function fetchAddressBalanceChart(client4: TonClient4, address: Address, from: number = 30 * 24 * 60 * 60 * 1000, hoursInterval: number = 24) {
    const zeroDate = new Date();
    zeroDate.setHours(0);
    zeroDate.setMinutes(0);
    zeroDate.setSeconds(0);
    let fromTs = zeroDate.getTime() - from;
    fromTs = Math.floor(fromTs / 1000);

    let tillTs = Math.floor(zeroDate.getTime() / 1000);
    let keyTimePoints: number[] = [];
    for (let ts = tillTs; ts > fromTs; ts -= 60 * 60 * hoursInterval) {
        keyTimePoints.push(ts);
    }

    let keyBlocks = await Promise.all(keyTimePoints.map(async (ts) => ({ block: await client4.getBlockByUtime(ts), ts })));
    let chaoticPoints = await Promise.all(keyBlocks.map(async block => {
        let result = await client4.getAccountLite(block.block.shards[0].seqno, address);
        if (result.account.balance.coins) {
            return { ts: block.ts, balance: BigInt(result.account.balance.coins) };
        }
        return null;
    }));
    let points = chaoticPoints.filter(a => a !== null) as { ts: number, balance: bigint }[];
    points = points.sort((a, b) => a.ts - b.ts);

    const chart: { balance: string, ts: number, diff: string }[] = []
    let prevBalance = toNano(1);

    for (let point of points) {
        chart.push({
            balance: point.balance.toString(10),
            ts: point.ts * 1000,
            diff: (point.balance - prevBalance).toString(10)
        });

        prevBalance = point.balance;
    }

    return { chart };
}