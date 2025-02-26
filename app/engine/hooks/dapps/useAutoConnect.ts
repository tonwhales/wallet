import { CONNECT_EVENT_ERROR_CODES, ConnectEvent } from "@tonconnect/protocol";
import { useAppConnections } from "./useAppConnections";
import { extensionKey } from "./useAddExtension";
import { useConnectApp } from "./useConnectApp";
import { ConnectEventError, TonConnectBridgeType } from '../../tonconnect/types';
import { tonConnectDeviceInfo } from '../../tonconnect/config';

export function useAutoConnect(address?: string): (endpoint: string) => Promise<ConnectEvent> {
    const getConnections = useAppConnections(address);
    const connectApp = useConnectApp(address);
    return async (endpoint: string) => {
        try {
            const app = connectApp(endpoint);
            const connections = app ? getConnections(extensionKey(app.url)) : [];

            if (
                !app ||
                !connections ||
                connections.length === 0 ||
                app.autoConnectDisabled
            ) {
                throw new ConnectEventError(
                    CONNECT_EVENT_ERROR_CODES.UNKNOWN_APP_ERROR,
                    'Unknown app',
                    0
                );
            }

            const injectedConnection = connections.find((item) => item.type === TonConnectBridgeType.Injected);

            if (!injectedConnection) {
                throw new ConnectEventError(
                    CONNECT_EVENT_ERROR_CODES.UNKNOWN_APP_ERROR,
                    'No injected connection',
                    0
                );
            }

            const event: ConnectEvent = {
                event: 'connect',
                payload: {
                    items: injectedConnection.replyItems,
                    device: tonConnectDeviceInfo,
                },
                id: 0,
            }

            return event;
        } catch (error: any) {
            if (error instanceof ConnectEventError) {
                return error;
            }

            return new ConnectEventError(
                CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
                error?.message,
                0
            );
        }
    }
}