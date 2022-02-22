import { fetchPrice, PriceState } from "./fetchPrice";
import { InvalidateSync } from "teslabot";

// Price state watch
export function watchPrice(handler: (state: PriceState) => Promise<void> | void) {
    let ended = false;
    const invalidateSync = new InvalidateSync(async () => {
        const state = await fetchPrice();
        if (ended) {
            return;
        }
        await handler(state);
    });
    const timer = setInterval(() => {
        invalidateSync.invalidate();
    }, 10000);
    return () => {
        if (!ended) {
            ended = true;
            clearInterval(timer);
        }
    }
}