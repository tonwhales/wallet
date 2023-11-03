import { useConnectAppByClientSessionId } from "../../hooks/dapps/useConnectApp";
import { SEND_TRANSACTION_ERROR_CODES, SessionCrypto } from "@tonconnect/protocol";
import { sendTonConnectResponse } from "../../api/sendTonConnectResponse";
import { getTimeSec } from "../../../utils/getTimeSec";
import { warn } from "../../../utils/log";
import { Cell, fromNano, toNano } from "@ton/core";
import { useDeleteActiveRemoteRequests } from "./useDeleteActiveRemoteRequests";
import { SendTransactionRequest, SignRawParams } from '../../tonconnect/types';

export function usePrepareConnectRequest() {
  const findConnectedAppByClientSessionId = useConnectAppByClientSessionId();
  const deleteActiveRemoteRequest = useDeleteActiveRemoteRequests();

  return (request: { from: string } & SendTransactionRequest) => {
    const params = JSON.parse(request.params[0]) as SignRawParams;

    const isValidRequest =
      params && typeof params.valid_until === 'number' &&
      Array.isArray(params.messages) &&
      params.messages.every((msg) => !!msg.address && !!msg.amount);

    const { session } = findConnectedAppByClientSessionId(request.from);
    if (!session) {
      deleteActiveRemoteRequest(request.from);
      return;
    }
    const sessionCrypto = new SessionCrypto(session.sessionKeyPair);

    if (!isValidRequest) {
      deleteActiveRemoteRequest(request.from);
      sendTonConnectResponse({
        response: {
          error: {
            code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
            message: `Bad request`,
          },
          id: request.id.toString(),
        },
        sessionCrypto,
        clientSessionId: request.from
      })
      return;
    }

    const { valid_until } = params;
    if (valid_until < getTimeSec()) {
      deleteActiveRemoteRequest(request.from);
      sendTonConnectResponse({
        response: {
          error: {
            code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
            message: `Request timed out`,
          },
          id: request.id.toString(),
        },
        sessionCrypto,
        clientSessionId: request.from
      })
      return;
    }

    const { connectedApp } = findConnectedAppByClientSessionId(request.from);

    const messages = [];
    for (const message of params.messages) {
      try {
        const msg = {
          amount: toNano(fromNano(message.amount)),
          target: message.address,
          amountAll: false,
          payload: message.payload ? Cell.fromBoc(Buffer.from(message.payload, 'base64'))[0] : null,
          stateInit: message.stateInit ? Cell.fromBoc(Buffer.from(message.stateInit, 'base64'))[0] : null
        }
        messages.push(msg);
      } catch (error) {
        warn(error);
      }
    }

    return {
      request,
      sessionCrypto,
      messages,
      app: connectedApp
    }
  }
}
