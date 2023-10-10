import { useCallback, useMemo, useState } from 'react';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { ConnectEventError, SignRawParams, TonConnectBridgeType, TonConnectInjectedBridge } from '../../legacy/tonconnect/types';
import { useTonConnectExtensions } from './useTonConnectExtenstions';
import { useConnectApp } from './useConnectApp';
import { AppRequest, CONNECT_EVENT_ERROR_CODES, ConnectEvent, RpcMethod, SEND_TRANSACTION_ERROR_CODES, WalletEvent, WalletResponse } from '@tonconnect/protocol';
import { CURRENT_PROTOCOL_VERSION, tonConnectDeviceInfo } from '../../legacy/tonconnect/config';
import { checkProtocolVersionCapability, verifyConnectRequest } from '../../legacy/tonconnect/utils';
import { getAppManifest } from '../../getters/getAppManifest';
import { TonConnectAuthResult } from '../../../fragments/secure/TonConnectAuthenticateFragment';
import { useSaveAppConnection } from '../../effects/dapps/useSaveAppConnection';
import { useAutoConnect } from '../../effects/dapps/useAutoConnect';
import { useRemoveInjectedConnection } from '../../effects/dapps/useRemoveInjectedConnection';
import { getTimeSec } from '../../../utils/getTimeSec';
import { Cell, fromNano, toNano } from '@ton/core';
import { extractDomain } from '../../utils/extractDomain';
import { useWebViewBridge } from '../../legacy/tonconnect/useWebViewBridge';
import { useDisconnectApp } from '../../effects/dapps/useDisconnect';

export function useDAppBridge(endpoint: string, navigation: TypedNavigation): any {
    const saveAppConnection = useSaveAppConnection();
    const getConnectApp = useConnectApp();
    const autoConnect = useAutoConnect();
    const removeInjectedConnection = useRemoveInjectedConnection();
    const onDisconnect = useDisconnectApp();

    const [connectEvent, setConnectEvent] = useState<ConnectEvent | null>(null);

    const app = useMemo(() => {
        return getConnectApp(endpoint);
    }, [endpoint, getConnectApp]);

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
                        );
                    }

                    const event = await new Promise<ConnectEvent>((resolve, reject) => {
                        const callback = (result: TonConnectAuthResult) => {
                            if (result.ok) {
                                saveAppConnection({
                                    app: {
                                        name: manifest.name,
                                        url: manifest.url,
                                        iconUrl: manifest.iconUrl,
                                        autoConnectDisabled: false,
                                        manifestUrl: request.manifestUrl,
                                    },
                                    connection: {
                                        type: TonConnectBridgeType.Injected,
                                        replyItems: result.replyItems,
                                    }
                                });

                                resolve({
                                    event: 'connect',
                                    payload: {
                                        items: result.replyItems,
                                        device: tonConnectDeviceInfo,
                                    },
                                });

                                // return;
                            } else {
                                reject();
                            }
                        }

                        navigation.navigateConnectAuth({
                            type: 'callback',
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
                    );
                }
            },

            restoreConnection: async () => {
                const event = await autoConnect(endpoint);
                setConnectEvent(event);
                return event;
            },

            disconnect: async () => {
                setConnectEvent(null);
                removeInjectedConnection(endpoint);
                return;
            },

            send: async <T extends RpcMethod>(request: AppRequest<T>) => {

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

                        navigation.navigateTransfer({
                            text: null,
                            order: {
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
                                } : undefined
                            },
                            job: null,
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
    }, [endpoint, app]);

    const [ref, injectedJavaScriptBeforeContentLoaded, onMessage, sendEvent] =
        useWebViewBridge<TonConnectInjectedBridge, WalletEvent>(bridgeObject);

    const disconnect = useCallback(async () => {
        try {
            await onDisconnect(endpoint);
            sendEvent({ event: 'disconnect', payload: {} });
        } catch { }
    }, [endpoint, sendEvent]);

    return {
        ref,
        injectedJavaScriptBeforeContentLoaded,
        onMessage,
        isConnected,
        disconnect,
    };
    return {} as any;
}