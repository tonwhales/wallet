import { extensionKey } from "./useAddExtension";
import { ConnectedApp, useConnectExtensions } from "./useTonConnectExtenstions";
import { useAppConnections } from "./useAppConnections";
import { ConnectedAppConnectionRemote, TonConnectBridgeType } from '../../tonconnect/types';

export function useConnectApp(address?: string) {
    const [extensions] = useConnectExtensions(address);

    const apps = Object.values(extensions);

    return (url: string) => {
        const fixedUrl = url.replace(/\/$/, '');
        return apps.find((app) => fixedUrl.startsWith(app.url.replace(/\/$/, ''))) ?? null;
    }
}

export function useConnectAppByClientSessionId() {
    const [extensions] = useConnectExtensions();
    const connectAppConnections = useAppConnections();
    const connectedAppsList = Object.values(extensions);

    return (clientSessionId: string) => {
        let res: { connectedApp: ConnectedApp | null, session: ConnectedAppConnectionRemote | null } = { connectedApp: null, session: null };

        for (const app of connectedAppsList) {
            const connections = connectAppConnections(extensionKey(app.url));
            for (const item of connections ?? []) {
                if (item.type === TonConnectBridgeType.Remote && item.clientSessionId === clientSessionId) {
                    res = { connectedApp: app, session: item };
                    break;
                }
            }
        }
        return res;
    }
}