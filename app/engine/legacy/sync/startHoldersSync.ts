import { AppState } from "react-native";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";

export function startHoldersSync(engine: Engine) {
    let sync = createEngineSync('zenpay-sync', engine, async () => {
        await engine.products.holders.doSync();
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}