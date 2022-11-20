import { AppState } from "react-native";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";

export function startZenPaySync(engine: Engine) {

    let sync = createEngineSync('zen-pay-sync', engine, async () => {
        await engine.products.zenPay.doSync();
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}