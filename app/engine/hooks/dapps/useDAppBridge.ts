import { useCallback, useEffect, useMemo, useState } from 'react';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { useConnectApp } from './useConnectApp';
import { AppRequest, CONNECT_EVENT_ERROR_CODES, ConnectEvent, RpcMethod, SEND_TRANSACTION_ERROR_CODES, WalletEvent, WalletResponse } from '@tonconnect/protocol';
import { getAppManifest } from '../../getters/getAppManifest';
import { TonConnectAuthResult, TonConnectAuthType } from '../../../fragments/secure/dapps/TonConnectAuthenticateFragment';
import { useSaveAppConnection } from './useSaveAppConnection';
import { useAutoConnect } from './useAutoConnect';
import { useRemoveInjectedConnection } from './useRemoveInjectedConnection';
import { getTimeSec } from '../../../utils/getTimeSec';
import { Cell, fromNano, toNano } from '@ton/core';
import { extractDomain } from '../../utils/extractDomain';
import { useDisconnectApp } from './useDisconnect';
import { ConnectEventError, SignRawParams, TonConnectBridgeType, TonConnectInjectedBridge } from '../../tonconnect/types';
import { CURRENT_PROTOCOL_VERSION, tonConnectDeviceInfo } from '../../tonconnect/config';
import { checkProtocolVersionCapability, verifyConnectRequest } from '../../tonconnect/utils';
import { useWebViewBridge } from './useWebViewBridge';
import { getCurrentAddress } from '../../../storage/appState';
import { useHoldersLedgerTonconnectHandler } from './useHoldersLedgerTonconnectHandler';

export function useDAppBridge(endpoint: string, navigation: TypedNavigation, address?: string, isLedger?: boolean): any {
    const saveAppConnection = useSaveAppConnection();
    const getConnectApp = useConnectApp(address);
    const autoConnect = useAutoConnect(address);
    const removeInjectedConnection = useRemoveInjectedConnection(address);
    const onDisconnect = useDisconnectApp(address);
    
    const account = address ?? getCurrentAddress().addressString;
    const handleLedgerRequest = useHoldersLedgerTonconnectHandler();

    const [connectEvent, setConnectEvent] = useState<ConnectEvent | null>(null);
    const [requestId, setRequestId] = useState(0);

    const app = getConnectApp(endpoint);

    const isConnected = useMemo(() => {
        if (!app) {
            return false;
        }

        return Boolean(connectEvent && connectEvent.event === 'connect');
    }, [app, connectEvent]);

    const bridgeObject = useMemo((): TonConnectInjectedBridge => {
        return {
            deviceInfo: tonConnectDeviceInfo,
            protocolVersion: CURRENT_PROTOCOL_VERSION,
            isWalletBrowser: true,

            connect: async (protocolVersion, request) => {
                try {
                    checkProtocolVersionCapability(protocolVersion);
                    verifyConnectRequest(request);

                    const manifest = await getAppManifest(request.manifestUrl);

                    if (!manifest) {
                        return new ConnectEventError(
                            CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
                            'Unknown app',
                            requestId
                        );
                    }

                    const event = await new Promise<ConnectEvent>((resolve, reject) => {
                        const callback = (result: TonConnectAuthResult) => {
                            if (result.ok) {
                                saveAppConnection({
                                    address: account,
                                    app: {
                                        name: manifest.name,
                                        url: manifest.url,
                                        iconUrl: manifest.iconUrl,
                                        autoConnectDisabled: false,
                                        manifestUrl: request.manifestUrl,
                                    },
                                    connections: [{
                                        type: TonConnectBridgeType.Injected,
                                        replyItems: result.replyItems,
                                    }]
                                });

                                resolve({
                                    event: 'connect',
                                    payload: {
                                        items: result.replyItems,
                                        device: tonConnectDeviceInfo,
                                    },
                                    id: requestId
                                });

                                // return;
                            } else {
                                reject();
                            }
                        }

                        navigation.navigateConnectAuth({
                            type: TonConnectAuthType.Callback,
                            protocolVersion: protocolVersion as 2,
                            request,
                            callback
                        });

                    });
                    setConnectEvent(event);
                    return event;

                } catch (error: any) {
                    if (error instanceof ConnectEventError) {
                        return error;
                    }

                    return new ConnectEventError(
                        CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
                        error?.message,
                        requestId
                    );
                }
            },

            restoreConnection: async () => {
                const event = await autoConnect(endpoint);
                setRequestId(event.id);
                setConnectEvent(event);
                return event;
            },

            disconnect: async () => {
                setConnectEvent(null);
                removeInjectedConnection(endpoint);
                setRequestId(0);
                return;
            },

            send: async <T extends RpcMethod>(request: AppRequest<T>) => {
                setRequestId(Number(request.id));
                if (!app) {
                    return {
                        error: {
                            code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                            message: 'Unknown app',
                        },
                        id: request.id.toString(),
                    };
                }

                return new Promise<WalletResponse<T>>((resolve) => {
                    const callback = (response: WalletResponse<T>) => {
                        resolve(response);
                    };
                    if (!app) {
                        callback({
                            error: {
                                code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                                message: 'Unknown app',
                            },
                            id: request.id.toString(),
                        });
                    }

                    if (request.method === 'sendTransaction') {
                        const params = JSON.parse(request.params[0]) as SignRawParams;

                        const isValidRequest =
                            params && typeof params.valid_until === 'number' &&
                            Array.isArray(params.messages) &&
                            params.messages.every((msg) => !!msg.address && !!msg.amount);

                        if (!isValidRequest) {
                            callback({
                                error: {
                                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                                    message: `Bad request`,
                                },
                                id: request.id.toString(),
                            });
                            return;
                        }

                        const { valid_until } = params;

                        if (valid_until < getTimeSec()) {
                            callback({
                                error: {
                                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                                    message: `Request timed out`,
                                },
                                id: request.id.toString(),
                            });
                            return;
                        }

                        if (isLedger) {
                            handleLedgerRequest(request.id.toString(), params, callback, extractDomain(endpoint));
                            return;
                        }

                        navigation.navigateTransfer({
                            text: null,
                            order: {
                                type: 'order',
                                messages: params.messages.map((msg) => {
                                    return {
                                        amount: toNano(fromNano(msg.amount)),
                                        target: msg.address,
                                        amountAll: false,
                                        payload: msg.payload ? Cell.fromBoc(Buffer.from(msg.payload, 'base64'))[0] : null,
                                        stateInit: msg.stateInit ? Cell.fromBoc(Buffer.from(msg.stateInit, 'base64'))[0] : null
                                    }
                                }),
                                app: app ? {
                                    title: app.name,
                                    domain: extractDomain(app.url),
                                    url: app.url
                                } : undefined
                            },
                            callback: (ok, result) => {
                                if (ok) {
                                    callback({
                                        result: result?.toBoc({ idx: false }).toString('base64') ?? '',
                                        id: request.id.toString(),
                                    });
                                } else {
                                    callback({
                                        error: {
                                            code: SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                                            message: 'User rejected',
                                        },
                                        id: request.id.toString(),
                                    });
                                }
                            },
                            back: 1
                        })
                        return;
                    }

                    callback({
                        error: {
                            code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                            message: `Method "${request.method}" is not supported`,
                        },
                        id: request.id.toString(),
                    });
                });
            }
        };
    }, [endpoint, app, requestId, saveAppConnection, autoConnect, removeInjectedConnection, handleLedgerRequest]);

    const [ref, injectedJavaScriptBeforeContentLoaded, onMessage, sendEvent] =
        useWebViewBridge<TonConnectInjectedBridge, WalletEvent>(bridgeObject);

    const disconnect = useCallback(async () => {
        try {
            onDisconnect(endpoint, requestId);
            sendEvent({ event: 'disconnect', payload: {}, id: requestId });
        } catch { }
    }, [endpoint, sendEvent, requestId]);

    return {
        ref,
        injectedJavaScriptBeforeContentLoaded,
        onMessage,
        isConnected,
        disconnect,
    };
}