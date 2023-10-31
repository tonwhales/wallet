import { CONNECT_EVENT_ERROR_CODES, ConnectEvent } from "@tonconnect/protocol";
import { getCurrentAddress } from "../../../storage/appState";
import { contractFromPublicKey } from "../../contractFromPublicKey";
import { useNetwork } from "../../hooks/useNetwork";
import { warn } from "../../../utils/log";
import { useAppConnections } from "../../hooks/dapps/useAppConnections";
import { extensionKey } from "./useAddExtension";
import { useConnectApp } from "../../hooks/dapps/useConnectApp";
import { beginCell, storeStateInit } from "@ton/core";
import { ConnectEventError } from '../../tonconnect/types';
import { ConnectReplyBuilder } from '../../tonconnect/ConnectReplyBuilder';
import { tonConnectDeviceInfo } from '../../tonconnect/config';

export function useAutoConnect(): (endpoint: string) => Promise<ConnectEvent> {
    const { isTestnet } = useNetwork();
    const getConnections = useAppConnections();
    const connectApp = useConnectApp();
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
                walletStateInit,
                isTestnet
            );

            return {
                event: 'connect',
                payload: {
                    items: replyItems,
                    device: tonConnectDeviceInfo,
                },
            };
        } catch (error: any) {
            if (error instanceof ConnectEventError) {
                return error;
            }

            return new ConnectEventError(
                CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
                error?.message,
            );
        }
    }
}