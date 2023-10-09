import { DisconnectEvent, SessionCrypto } from "@tonconnect/protocol";
import { useConnectApp } from "../../hooks/dapps/useConnectApp";
import { useAppConnections } from "../../hooks/dapps/useAppConnections";
import { ConnectedAppConnectionRemote, TonConnectBridgeType } from "../../legacy/tonconnect/types";
import { extensionKey } from "./useAddExtension";
import { sendTonConnectResponse } from "../../api/sendTonConnectResponse";
import { useConnectPendingRequests } from "../../hooks/dapps/useConnectPendingRequests";
import { useRemoveConnectApp } from "./useRemoveConnectApp";

export function useDisconnectApp() {
    const getConnectApp = useConnectApp();
    const getConnections = useAppConnections();
    const removeConnectedApp = useRemoveConnectApp();
    const [requests, update] = useConnectPendingRequests();

    return (endpoint: string) => {
        const app = getConnectApp(endpoint);

        if (!app) {
            return;
        }

        const connections = getConnections(extensionKey(endpoint));
        const remoteConnections = (connections ?? []).filter(
            (connection) => connection.type === TonConnectBridgeType.Remote,
        ) as ConnectedAppConnectionRemote[];

        remoteConnections.forEach((connection) => {
            // Send disconnect event
            const sessionCrypto = new SessionCrypto(connection.sessionKeyPair);
            const event: DisconnectEvent = { event: 'disconnect', payload: {} };
            sendTonConnectResponse({ response: event, sessionCrypto, clientSessionId: connection.clientSessionId });
        });

        const temp = [...requests];
        remoteConnections.forEach((connection) => {
            const index = temp.findIndex((item) => item.from === connection.clientSessionId);
            if (index !== -1) {
                temp.splice(index, 1);
            }
        });
        update(temp);

        removeConnectedApp(endpoint);
    }
}