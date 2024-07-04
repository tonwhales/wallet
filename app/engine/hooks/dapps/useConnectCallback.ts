import { SEND_TRANSACTION_ERROR_CODES, SessionCrypto } from "@tonconnect/protocol";
import { Cell } from "@ton/core";
import { sendTonConnectResponse } from "../../api/sendTonConnectResponse";
import { useDeleteActiveRemoteRequests } from "./useDeleteActiveRemoteRequests";
import { SendTransactionError, SendTransactionRequest } from '../../tonconnect/types';

const errorMessage = 'Wallet declined request';

export function useConnectCallback() {
    const deleteActiveRemoteRequests = useDeleteActiveRemoteRequests();
    return async (
        ok: boolean,
        result: Cell | null,
        request: { from: string } & SendTransactionRequest,
        sessionCrypto: SessionCrypto
    ) => {
        const response = !ok
            ? new SendTransactionError(request.id, SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR, errorMessage)
            : { result: result?.toBoc({ idx: false }).toString('base64') ?? '', id: request.id };

        await sendTonConnectResponse({ response, sessionCrypto, clientSessionId: request.from });
        deleteActiveRemoteRequests(request.from);
    }
}