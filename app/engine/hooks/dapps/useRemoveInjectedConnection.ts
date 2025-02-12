import { getCurrentAddress } from "../../../storage/appState";
import { warn } from "../../../utils/log";
import { useConnectExtensions } from "../../hooks/dapps/useTonConnectExtenstions";
import { TonConnectBridgeType } from '../../tonconnect/types';
import { extensionKey } from "./useAddExtension";
import { useSetAppsConnectionsState } from "./useSetTonconnectConnections";

export function useRemoveInjectedConnection(address?: string) {
    const [extensions] = useConnectExtensions(address);
    const setConnections = useSetAppsConnectionsState();

    return (endpoint: string) => {
        // format endpoint to origin
        try {
            const url = new URL(endpoint);
            endpoint = url.origin;
        } catch {
            warn(`Invalid URL ${endpoint}`);
            return;
        }
        let key = extensionKey(endpoint);

        const app = extensions[key];
        
        if (!app) {
            return;
        }

        const currentAccount = getCurrentAddress();
        const account = address ?? currentAccount?.addressString;

        setConnections(
            account,
            (prev) => {
                const newConnections = (prev[key] ?? []).filter((item) => item.type !== TonConnectBridgeType.Injected);
                return {
                    ...prev,
                    [key]: newConnections,
                };
            }
        );
    }
}