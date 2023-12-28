import { useTonConnectExtensions } from "../../hooks/dapps/useTonConnectExtenstions";
import { TonConnectBridgeType } from '../../tonconnect/types';
import { extensionKey } from "./useAddExtension";
import { useSetAppsConnectionsState } from "./useSetTonconnectConnections";

export function useRemoveInjectedConnection() {
    const [extensions,] = useTonConnectExtensions();
    const setConnections = useSetAppsConnectionsState();

    return (endpoint: string) => {
        let key = extensionKey(endpoint);
    
        const app = extensions[key];
        if (!app) {
            return;
        }

        setConnections((prev) => {
            prev[key] = (prev[key] ?? []).filter((item) => item.type !== TonConnectBridgeType.Injected);
            return prev;
        });
    }
}