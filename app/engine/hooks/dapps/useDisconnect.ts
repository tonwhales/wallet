import { DisconnectEvent, SessionCrypto, WalletResponse } from "@tonconnect/protocol";
import { useConnectApp } from "../../hooks/dapps/useConnectApp";
import { useAppConnections } from "../../hooks/dapps/useAppConnections";
import { extensionKey } from "./useAddExtension";
import { sendTonConnectResponse } from "../../api/sendTonConnectResponse";
import { useConnectPendingRequests } from "../../hooks/dapps/useConnectPendingRequests";
import { useRemoveConnectApp } from "./useRemoveConnectApp";
import { ConnectedAppConnectionRemote, TonConnectBridgeType } from '../../tonconnect/types';

export function useDisconnectApp(address?: string) {
    const getConnectApp = useConnectApp(address);
    const getConnections = useAppConnections(address);
    const removeConnectedApp = useRemoveConnectApp(address);
    const [, update] = useConnectPendingRequests();

    return (endpoint: string, eventId: number | string) => {
        const app = getConnectApp(endpoint);
        let id = 0;

        if (typeof eventId === 'number') {
            id = eventId;
        } else {
            id = parseInt(eventId);
        }

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
            const event: DisconnectEvent = { event: 'disconnect', id, payload: {} };
            sendTonConnectResponse({ response: event, sessionCrypto, clientSessionId: connection.clientSessionId });
        });

        update((prev) => {
            const temp = [...prev];

            remoteConnections.forEach((connection) => {
                const index = temp.findIndex((item) => item.from === connection.clientSessionId);
                if (index !== -1) {
                    temp.splice(index, 1);
                }
            });

            return temp
        });

        removeConnectedApp(endpoint);
    }
}