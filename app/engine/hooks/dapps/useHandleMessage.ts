import { AppRequest, Base64, RpcMethod, SEND_TRANSACTION_ERROR_CODES, SessionCrypto, WalletResponse, hexToByteArray } from '@tonconnect/protocol';
import { MessageEvent } from 'react-native-sse';
import { sendTonConnectResponse } from '../../api/sendTonConnectResponse';
import { warn } from '../../../utils/log';
import { useConnectAppByClientSessionId, useConnectPendingRequests, useDisconnectApp, useNetwork } from '../../hooks';
import { useToaster } from '../../../components/toast/ToastProvider';
import { checkTonconnectSignRequest, checkTonconnectTxRequest, ConnectedAppConnectionRemote, setLastEventId, SignDataPayload, SignDataRawRequest, SignRawTxParams, tonconnectRpcReqScheme } from '../../tonconnect';
import { saveErrorLog } from '../../../storage';

export function useHandleMessage(
    connections: ConnectedAppConnectionRemote[],
    logger: { log: (src: any) => void; warn: (src: any) => void; }
) {
    const toaster = useToaster();
    const [, update] = useConnectPendingRequests();
    const findConnectedAppByClientSessionId = useConnectAppByClientSessionId();
    const disconnectApp = useDisconnectApp();
    const { isTestnet } = useNetwork();

    return async (event: MessageEvent) => {
        try {
            if (event.lastEventId) {
                setLastEventId(event.lastEventId);
            }

            const { from, message } = JSON.parse(event.data!);

            const connection = connections.find((item) => item.clientSessionId === from);

            if (!connection) {
                return;
            }

            const sessionCrypto = new SessionCrypto(connection.sessionKeyPair);

            const decryptedRequest = sessionCrypto.decrypt(
                Base64.decode(message).toUint8Array(),
                hexToByteArray(from),
            );

            const parsed = JSON.parse(decryptedRequest);

            const callback = (response: WalletResponse<RpcMethod>) => {
                sendTonConnectResponse({ response, sessionCrypto, clientSessionId: from });
            }

            if (!tonconnectRpcReqScheme.safeParse(parsed).success) {
                callback({
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                        message: 'Invalid request',
                    },
                    id: parsed.id.toString(),
                });
                return;
            }

            const request = parsed as (SignDataRawRequest | AppRequest<'sendTransaction'> | AppRequest<'disconnect'>);

            const { connectedApp } = findConnectedAppByClientSessionId(from);

            if (!connectedApp) {
                callback({
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                        message: 'Unknown app',
                    },
                    id: request.id.toString(),
                });
                return;
            }

            switch (request.method) {
                case 'sendTransaction':
                    try {
                        const params = JSON.parse(request.params[0]) as SignRawTxParams;

                        const isValidRequest = checkTonconnectTxRequest(request.id.toString(), params, callback, isTestnet, toaster);

                        if (!isValidRequest) {
                            return;
                        }

                        update((prev) => {
                            const temp = [...prev];

                            const found = temp.find((item) => item.from === from);

                            if (!!found) {
                                callback({
                                    error: {
                                        code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                                        message: `Request already pending`,
                                    },
                                    id: request.id.toString(),
                                });
                            } else {
                                temp.push({
                                    from: from,
                                    id: request.id.toString(),
                                    params: request.params,
                                    method: 'sendTransaction'
                                });
                            }

                            return temp;
                        });
                    } catch (error) {
                        saveErrorLog({
                            message: error instanceof Error ? error.message : String(error),
                            stack: error instanceof Error ? error.stack : undefined,
                            url: 'useHandleMessage:sendTransaction',
                            additionalData: { requestId: request.id.toString() }
                        });
                        callback({
                            error: {
                                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                                message: `Bad request`,
                            },
                            id: request.id.toString(),
                        });
                    }
                    break;

                case 'disconnect':
                    if (connectedApp.url) {
                        disconnectApp(connectedApp!.url, request.id);
                        callback({
                            id: request.id.toString(),
                            result: {}
                        });
                        break;
                    }

                    callback({
                        error: {
                            code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                            message: 'App is not connected',
                        },
                        id: request.id.toString(),
                    });
                    break;

                case 'signData':
                    const params = JSON.parse(request.params[0]) as SignDataPayload;
                    const isValidRequest = checkTonconnectSignRequest(request.id.toString(), params, callback, toaster);

                    if (!isValidRequest) {
                        return;
                    }

                    update((prev) => {
                        const temp = [...prev];

                        const found = temp.find((item) => item.from === from);

                        if (!!found) {
                            callback({
                                error: {
                                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                                    message: `Request already pending`,
                                },
                                id: request.id.toString(),
                            });
                        } else {
                            temp.push({
                                from: from,
                                id: request.id.toString(),
                                params: request.params,
                                method: 'signData'
                            });
                        }

                        return temp;
                    });

                    break;
                default:
                    break;
            }
        } catch (error) {
            saveErrorLog({
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                url: 'useHandleMessage:main'
            });
            warn('Failed to handle message');
        }
    }
}