import { InvalidateSync } from "teslabot";
import { StakingPool } from "../utils/KnownPools";
import { fetchStakingPool, StakingPoolData } from "./fetchStakingPool";

export function watchStakingPool(pool: StakingPool, handler: (state: StakingPoolData) => Promise<void> | void) {
    let ended = false;
    const invalidateSync = new InvalidateSync(async () => {
        const state = await fetchStakingPool(pool.address, pool.name);
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