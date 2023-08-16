import React, { createContext, memo, useCallback, useEffect, useMemo, useState } from "react";
import { AppState, getAppState, setAppState as storeAppState } from "../storage/appState";
import { useAppConfig } from "../utils/AppConfigContext";
import { mixpanelFlush, mixpanelIdentify } from "../analytics/mixpanel";
import { createEngine } from "./createEngine";
import { EngineContext } from "./Engine";
import { useRecoilCallback } from "recoil";
import { useReboot } from "../utils/RebootContext";

export type AppStateManager = {
    updateAppState: (state: AppState) => void,
    current: AppState
}

export const AppStateManagerContext = createContext<AppStateManager | null>(null);

export const AppStateManagerLoader = memo(({ children, sessionId }: { children?: any, sessionId: number }) => {
    const { AppConfig } = useAppConfig();
    const reboot = useReboot();
    const recoilUpdater = useRecoilCallback<[any, any], any>(({ set }) => (node, value) => set(node, value));

    const appState = useMemo(() => {
        const storedAppState = getAppState();
        if (!storedAppState) {
            return { state: { addresses: [], selected: -1 }, engine: null };
        }

        if (storedAppState.selected !== -1 && storedAppState.selected < storedAppState.addresses.length) {
            const ex = storedAppState.addresses[storedAppState.selected];

            // Identify user profile by address
            mixpanelIdentify(ex.address.toFriendly({ testOnly: AppConfig.isTestnet }));
            mixpanelFlush(AppConfig.isTestnet);

            return {
                state: storedAppState,
                engine: createEngine({
                    address: ex.address,
                    publicKey: ex.publicKey,
                    utilityKey: ex.utilityKey,
                    recoilUpdater,
                    isTestnet: AppConfig.isTestnet,
                    sessionId
                })
            }
        } else {
            return { state: storedAppState, engine: null };
        }
    }, []);

    const onAppStateUpdate = useCallback((newState: AppState) => {
        if (newState.selected !== undefined && newState.selected < newState.addresses.length) {
            storeAppState(newState, AppConfig.isTestnet);
            appState?.engine?.destroy();
        }
        reboot();

    }, [AppConfig.isTestnet]);


    useEffect(() => {
        return () => {
            if (appState.engine) {
                appState.engine.destroy();
            }
        }
    }, []);

    return (
        <AppStateManagerContext.Provider value={{ updateAppState: onAppStateUpdate, current: appState.state }}>
            <EngineContext.Provider value={appState.engine}>
                {children}
            </EngineContext.Provider>
        </AppStateManagerContext.Provider>
    );
});

export function useAppStateManager() {
    const ctx = React.useContext(AppStateManagerContext);
    if (!ctx) {
        throw new Error('AppStateManagerContext not initialized');
    }
    return ctx;
}
