import { extensionKey } from "../../effects/dapps/useAddExtension";
import { ConnectedAppConnection, TonConnectBridgeType } from "../../legacy/tonconnect/types";
import { useTonConnectExtensions } from "./useTonConnectExtenstions";
import { useAppConnections } from "./useAppConnections";

export function useConnectApp() {
    const [extensions,] = useTonConnectExtensions();

    const apps = Object.values(extensions.installed);

    return (url: string) => {
        const fixedUrl = url.replace(/\/$/, '');;
        return apps.find((app) => fixedUrl.startsWith(app.url.replace(/\/$/, ''))) ?? null;
    }
}

export function useConnectAppByClientSessionId() {
    const [extensions,] = useTonConnectExtensions();
    const connectAppConnections = useAppConnections();
    const connectedAppsList = Object.values(extensions.installed);

    return (clientSessionId: string) => {

        let connection: ConnectedAppConnection | null = null;

        const connectedApp = connectedAppsList.find((app) => {
            const connections = connectAppConnections(extensionKey(app.url));
            return connections?.find((item) => {
                if (item.type === TonConnectBridgeType.Remote && item.clientSessionId === clientSessionId) {
                    connection = item;
                    return true;
                }

                return false;
            })
        });

        return { connectedApp: connectedApp ?? null, connection };
    }
}