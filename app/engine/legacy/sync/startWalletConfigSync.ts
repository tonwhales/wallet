import { AppState } from "react-native";
import { fetchWalletConfig } from "../../api/fetchWalletConfig";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";

export function startWalletConfigSync(engine: Engine) {

    let sync = createEngineSync('wallet-config', engine, async () => {
        let config = await fetchWalletConfig(engine.address, engine.isTestnet);
        engine.persistence.walletConfig.setValue(engine.address, config);
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}