import { useMemo } from "react";
import { useAppConnections, useConnectApp } from "..";
import { extensionKey } from "./useAddExtension";
import { TonConnectBridgeType } from "../../tonconnect/types";
import { getFullConnectionsMap, getFullExtensionsMap } from "../../state/tonconnect";
import { getCurrentAddress } from "../../../storage/appState";

export function getIsConnectAppReady(appUrl: string, isTestnet: boolean, address?: string) {
    const full = getFullExtensionsMap();
    const acc = address ?? getCurrentAddress().address.toString({ testOnly: isTestnet });
    const fixedUrl = appUrl.replace(/\/$/, '');;
    const apps = full[acc];
    const app = Object.values(apps).find((app) => fixedUrl.startsWith(app.url.replace(/\/$/, ''))) ?? null;

    if (!app) {
        return false;
    }

    const fullConnections = getFullConnectionsMap();
    
    try {
        const key = extensionKey(app.url);
        const connections = fullConnections[acc][key];

        if (!connections.find((item) => item.type === TonConnectBridgeType.Injected)) {
            return false;
        }
    } catch (error) {
        return false;
    }

    return true;
}

export function useIsConnectAppReady(appUrl: string) {
    const connectApp = useConnectApp();
    const connectAppConnections = useAppConnections();

    return useMemo(() => {
        const app = connectApp(appUrl);

        // check if app is saved
        if (!app) {
            return false;
        }

        // check if the app has injected connection
        try {
            // we trycatch in case of invalid appUrl
            const key = extensionKey(appUrl);

            const connections = connectAppConnections(key);

            if (!connections.find((item) => item.type === TonConnectBridgeType.Injected)) {
                return false;
            }
        } catch {
            return false;
        }

        return true;
    }, [connectApp, connectAppConnections]);
}