import BN from "bn.js";
import { AppState } from "react-native";
import { Address, TonClient4 } from "ton";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";

export type AccountBalanceChart = {
    chart: {
        balance: string;
        ts: number;
        diff: string;
    }[]
}

async function getMonthlyAccountBalanceChart(client4: TonClient4, address: Address) {
    const zeroDate = new Date();
    zeroDate.setHours(0);
    zeroDate.setMinutes(0);
    zeroDate.setSeconds(0);
    let fromTs = zeroDate.getTime() - 30 * 24 * 60 * 60 * 1000;
    fromTs = Math.floor(fromTs / 1000);

    let tillTs = Math.floor(zeroDate.getTime() / 1000);
    let keyTimePoints: number[] = [];
    for (let ts = tillTs; ts > fromTs; ts -= 60 * 60 * 24) {
        keyTimePoints.push(ts);
    }

    let keyBlocks = await Promise.all(keyTimePoints.map(async (ts) => ({ block: await client4.getBlockByUtime(ts), ts })));
    let chaoticPoints = await Promise.all(keyBlocks.map(async block => {
        let result = await client4.getAccountLite(block.block.shards[0].seqno, address);
        if (result.account.balance.coins) {
            return { ts: block.ts, balance: new BN(result.account.balance.coins, 10) };
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

    return { chart };
}

export function startAccountBalanceChartSync(engine: Engine) {
    // Sync balance chart
    let sync = createEngineSync('balanceChart', engine, async () => {
        let data = await getMonthlyAccountBalanceChart(engine.client4, engine.address);
        engine.persistence.accountBalanceChart.item(engine.address).update(() => data);
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}