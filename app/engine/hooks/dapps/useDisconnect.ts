import { DisconnectEvent, SessionCrypto, WalletEvent, WalletResponse } from "@tonconnect/protocol";
import { useConnectApp } from "../../hooks/dapps/useConnectApp";
import { useAppConnections } from "../../hooks/dapps/useAppConnections";
import { extensionKey } from "./useAddExtension";
import { sendTonConnectResponse } from "../../api/sendTonConnectResponse";
import { useConnectPendingRequests } from "../../hooks/dapps/useConnectPendingRequests";
import { useRemoveConnectApp } from "./useRemoveConnectApp";
import { ConnectedAppConnectionRemote, TonConnectBridgeType } from '../../tonconnect/types';

export function useDisconnectApp() {
    const getConnectApp = useConnectApp();
    const getConnections = useAppConnections();
    const removeConnectedApp = useRemoveConnectApp();
    const [, update] = useConnectPendingRequests();

    return (endpoint: string, eventId: number | string) => {
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
            const event: WalletResponse<'disconnect'> = { result: {}, id: eventId.toString() };
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