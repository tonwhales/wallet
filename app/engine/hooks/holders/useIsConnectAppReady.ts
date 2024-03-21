import { useMemo } from "react";
import { useAppConnections, useConnectApp } from "..";
import { extensionKey } from "../dapps/useAddExtension";
import { TonConnectBridgeType } from "../../tonconnect/types";

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