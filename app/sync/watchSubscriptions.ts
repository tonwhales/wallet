import { InvalidateSync } from "teslabot";
import { fetchSubscriptions, SubscriptionsStateData } from "./fetchSubscriptions";

export function watchSubscriptions(handler: (state: SubscriptionsStateData) => Promise<void> | void) {
    let ended = false;
    const invalidateSync = new InvalidateSync(async () => {
        const state = await fetchSubscriptions();
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