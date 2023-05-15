import React from "react";
import { AppState, getAppState, setAppState as storeAppState } from "../storage/appState";
import { useAppConfig } from "../utils/AppConfigContext";
import { mixpanelFlush, mixpanelIdentify } from "../analytics/mixpanel";
import { createEngine } from "./createEngine";
import { EngineContext } from "./Engine";
import { Address } from "ton";
import { useRecoilCallback } from "recoil";

export type AppStateManager = {
    selectAccount: (state: AppState) => void,
    currentAccount: {
        address: Address;
        publicKey: Buffer;
        secretKeyEnc: Buffer;
        utilityKey: Buffer;
    }
}

export const AppStateManagerContext = React.createContext<AppStateManager | null>(null);

export const AppStateManagerLoader = React.memo(({ children }: { children?: any }) => {
    const { AppConfig } = useAppConfig();
    const recoilUpdater = useRecoilCallback<[any, any], any>(({ set }) => (node, value) => set(node, value));

    const initAppState = React.useMemo(() => {
        const storedAppState = getAppState();
        if (!storedAppState) {
            return { state: { addresses: [], selected: -1 }, engine: null };
        }
        if (storedAppState.selected < storedAppState.addresses.length) {
            const ex = storedAppState.addresses[storedAppState.selected];

            // Identify user profile by address
            mixpanelIdentify(ex.address.toFriendly({ testOnly: AppConfig.isTestnet }));
            mixpanelFlush(AppConfig.isTestnet);

            return {
                state: storedAppState,
                engine: createEngine({ address: ex.address, publicKey: ex.publicKey, utilityKey: ex.utilityKey, recoilUpdater, isTestnet: AppConfig.isTestnet })
            }
        } else {
            return { state: storedAppState, engine: null };
        }
    }, []);

    const [appState, setAppState] = React.useState(initAppState);


    const onAccountSelected = React.useCallback((state: AppState) => {
        if (state.selected !== undefined && state.selected < state.addresses.length) {
            storeAppState(state, AppConfig.isTestnet);
            if (state.selected !== appState.state.selected) {
                appState.engine?.destroy();
                const ex = state.addresses[state.selected];
                mixpanelIdentify(ex.address.toFriendly({ testOnly: AppConfig.isTestnet }));
                mixpanelFlush(AppConfig.isTestnet);

                const storedAppState = getAppState();
                const engine = createEngine({ address: ex.address, publicKey: ex.publicKey, utilityKey: ex.utilityKey, recoilUpdater, isTestnet: AppConfig.isTestnet });

                setAppState({ state: storedAppState, engine });
            }
        }

    }, [appState, AppConfig.isTestnet]);


    React.useEffect(() => {
        return () => {
            if (initAppState.engine) {
                initAppState.engine.destroy();
            }
        }
    }, []);

    return (
        <AppStateManagerContext.Provider value={{ selectAccount: onAccountSelected, currentAccount: appState.state.addresses[appState.state.selected] }}>
            <EngineContext.Provider value={appState.engine}>
                {children}
            </EngineContext.Provider>
        </AppStateManagerContext.Provider>
    );
})
