import { InvalidateSync } from "teslabot";
import { fetchStakingPool, StakingPoolData } from "./fetchStakingPool";

export function watchStakingPool(handler: (state: StakingPoolData[]) => Promise<void> | void) {
    let ended = false;
    const invalidateSync = new InvalidateSync(async () => {
        const state = await fetchStakingPool();
        console.log('poolState', { state });
        if (ended) {
            return;
        }
        await handler(state);
    });
    const timer = setInterval(() => {
        invalidateSync.invalidate();
    }, 6 * 1000);
    return () => {
        if (!ended) {
            ended = true;
            clearInterval(timer);
        }
    }
}