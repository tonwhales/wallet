import { SEND_TRANSACTION_ERROR_CODES, SessionCrypto } from "@tonconnect/protocol";
import { Cell } from "@ton/core";
import { sendTonConnectResponse } from "../../api/sendTonConnectResponse";
import { useDeleteActiveRemoteRequests } from "./useDeleteActiveRemoteRequests";
import { SendTransactionError, SendTransactionRequest } from '../../tonconnect/types';

export function useConnectCallback() {
    const deleteActiveRemoteRequests = useDeleteActiveRemoteRequests();
    return (
        ok: boolean,
        result: Cell | null,
        request: { from: string } & SendTransactionRequest,
        sessionCrypto: SessionCrypto
    ) => {
        if (!ok) {
            sendTonConnectResponse({
                response: new SendTransactionError(
                    request.id,
                    SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                    'Wallet declined the request',
                ),
                sessionCrypto,
                clientSessionId: request.from
            });
        } else {
            sendTonConnectResponse({
                response: { result: result?.toBoc({ idx: false }).toString('base64') ?? '', id: request.id },
                sessionCrypto,
                clientSessionId: request.from
            });
        }

        deleteActiveRemoteRequests(request.from);
    }
}