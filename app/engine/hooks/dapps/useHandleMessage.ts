import { AppRequest, Base64, RpcMethod, SEND_TRANSACTION_ERROR_CODES, SessionCrypto, WalletResponse, hexToByteArray } from '@tonconnect/protocol';
import { MessageEvent } from 'react-native-sse';
import { sendTonConnectResponse } from '../../api/sendTonConnectResponse';
import { warn } from '../../../utils/log';
import { useConnectAppByClientSessionId, useDisconnectApp } from '../../hooks';
import { useConnectPendingRequests } from '../../hooks';
import { transactionRpcRequestCodec } from '../../tonconnect/codecs';
import { ConnectedAppConnectionRemote, SignRawParams } from '../../tonconnect/types';
import { checkTonconnectRequest, setLastEventId } from '../../tonconnect/utils';

export function useHandleMessage(
    connections: ConnectedAppConnectionRemote[],
    logger: { log: (src: any) => void; warn: (src: any) => void; }
) {
    const [, update] = useConnectPendingRequests();
    const findConnectedAppByClientSessionId = useConnectAppByClientSessionId();
    const disconnectApp = useDisconnectApp();

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

            if (!transactionRpcRequestCodec.is(parsed)) {
                callback({
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                        message: 'Invalid request',
                    },
                    id: parsed.id.toString(),
                });
                return;
            }
            const request = parsed as AppRequest<RpcMethod>;

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

            if (request.method === 'sendTransaction') {
                try {
                    const params = JSON.parse(request.params[0]) as SignRawParams;

                    const isValidRequest = checkTonconnectRequest(request.id.toString(), params, callback);

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
                    callback({
                        error: {
                            code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                            message: `Bad request`,
                        },
                        id: request.id.toString(),
                    });
                }
            } else if (request.method === 'disconnect') {
                disconnectApp(connectedApp!.url, request.id);
            } else {
                callback({
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                        message: `Method "${request.method}" is not supported by the wallet app`,
                    },
                    id: request.id.toString(),
                });
            }

        } catch {
            warn('Failed to handle message');
        }
    }
}