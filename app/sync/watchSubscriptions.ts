import { InvalidateSync } from "teslabot";
import { Engine } from "./Engine";
import { fetchSubscriptions, SubscriptionsStateData } from "./fetchSubscriptions";

export function watchSubscriptions(engine: Engine, handler: (state: SubscriptionsStateData) => Promise<void> | void) {
    let ended = false;
    const invalidateSync = new InvalidateSync(async () => {
        const state = await fetchSubscriptions(engine);
        if (ended) {
            return;
        }
        await handler(state);
    });
    const timer = setInterval(() => {
        invalidateSync.invalidate();
    }, 10 * 1000);
    return () => {
        if (!ended) {
            ended = true;
            clearInterval(timer);
        }
    }
}