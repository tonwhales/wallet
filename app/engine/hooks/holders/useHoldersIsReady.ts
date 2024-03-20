import { useMemo } from "react";
import { useAppConnections, useConnectApp } from "..";
import { extensionKey } from "../dapps/useAddExtension";
import { TonConnectBridgeType } from "../../tonconnect/types";

export function useHoldersIsReady(holdersUrl: string) {
    const connectApp = useConnectApp();
    const connectAppConnections = useAppConnections();

    return useMemo(() => {
        const app = connectApp(holdersUrl);

        // check if app is saved
        if (!app) {
            return false;
        }

        // check if the app has injected connection
        try {
            // we trycatch in case of invalid app.url
            const key = extensionKey(app.url);
    
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