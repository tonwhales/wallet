import { InvalidateSync } from "teslabot";
import { fetchStaking, StakingData } from "./fetchStaking";

export function watchStaking(handler: (state: StakingData) => Promise<void> | void) {
    let ended = false;
    const invalidateSync = new InvalidateSync(async () => {
        const state = await fetchStaking();
        if (ended) {
            return;
        }
        await handler(state);
    });
    const timer = setInterval(() => {
        invalidateSync.invalidate();
    }, 15 * 1000);
    return () => {
        if (!ended) {
            ended = true;
            clearInterval(timer);
        }
    }
}