import { CONNECT_EVENT_ERROR_CODES, ConnectEvent } from "@tonconnect/protocol";
import { getCurrentAddress } from "../../../storage/appState";
import { contractFromPublicKey } from "../../contractFromPublicKey";
import { useNetwork } from "../network/useNetwork";
import { warn } from "../../../utils/log";
import { useAppConnections } from "./useAppConnections";
import { extensionKey } from "./useAddExtension";
import { useConnectApp } from "./useConnectApp";
import { beginCell, storeStateInit } from "@ton/core";
import { ConnectEventError, TonConnectBridgeType } from '../../tonconnect/types';
import { ConnectReplyBuilder } from '../../tonconnect/ConnectReplyBuilder';
import { tonConnectDeviceInfo } from '../../tonconnect/config';
import { useSaveAppConnection } from ".";

export function useAutoConnect(): (endpoint: string) => Promise<ConnectEvent> {
    const { isTestnet } = useNetwork();
    const getConnections = useAppConnections();
    const connectApp = useConnectApp();
    const saveAppConnection = useSaveAppConnection();
    return async (endpoint: string) => {
        try {
            const connectedApp = connectApp(endpoint);
            const connections = getConnections(extensionKey(endpoint));

            if (
                !connectedApp ||
                connections.length === 0 ||
                connectedApp.autoConnectDisabled
            ) {
                throw new ConnectEventError(
                    CONNECT_EVENT_ERROR_CODES.UNKNOWN_APP_ERROR,
                    'Unknown app',
                    0
                );
            }

            let walletStateInit = '';
            const acc = getCurrentAddress();
            try {
                const contract = await contractFromPublicKey(acc.publicKey);
                const initialCode = contract.init.code;
                const initialData = contract.init.data;
                const stateInitCell = beginCell().store(storeStateInit({ code: initialCode, data: initialData })).endCell();
                walletStateInit = stateInitCell.toBoc({ idx: false }).toString('base64');
            } catch (err) {
                warn('Failed to get wallet state init');
            }

            const replyItems = ConnectReplyBuilder.createAutoConnectReplyItems(
                acc.address.toString({ testOnly: isTestnet, urlSafe: true, bounceable: true }),
                Uint8Array.from(acc.publicKey),
                walletStateInit,
                isTestnet
            );

            saveAppConnection({
                app: {
                    name: connectedApp.name,
                    url: connectedApp.url,
                    iconUrl: connectedApp.iconUrl,
                    autoConnectDisabled: false,
                    manifestUrl: connectedApp.manifestUrl,
                },
                connections: [{
                    type: TonConnectBridgeType.Injected,
                    replyItems: replyItems,
                }]
            });

            const event: ConnectEvent = {
                event: 'connect',
                payload: {
                    items: replyItems,
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