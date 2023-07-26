import { AppState } from "react-native";
import { fetchWalletConfig } from "../api/fetchWalletConfig";
import { Engine } from "../Engine";
import { createEngineSync } from "../utils/createEngineSync";
import { Address } from "ton";

export function startWalletConfigSync(engine: Engine, address?: Address) {

    let sync = createEngineSync('wallet-config', engine, async () => {
        let config = await fetchWalletConfig(address ?? engine.address, engine.isTestnet);
        engine.persistence.walletConfig.setValue(address ?? engine.address, config);
    });

    // Invalidate on start
    sync.invalidate();

    // Re-invalidate on any screen open
    AppState.addEventListener('change', () => {
        sync.invalidate();
    });
}