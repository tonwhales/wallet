import { InvalidateSync } from "teslabot";
import { Address } from "ton";
import { StakingPool } from "../utils/KnownPools";
import { Engine } from "./Engine";
import { fetchStakingPool } from "./fetchStakingPool";
import { StakingPoolState } from "./products/StakingPoolProduct";

export function watchStakingPool(engine: Engine, pool: StakingPool, target: Address, handler: (state: StakingPoolState) => Promise<void> | void) {
    let ended = false;
    const invalidateSync = new InvalidateSync(async () => {
        const state = await fetchStakingPool(engine, pool.address, target);
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