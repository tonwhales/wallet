import { useConnectAppByClientSessionId } from "./useConnectApp";
import { SEND_TRANSACTION_ERROR_CODES, SessionCrypto } from "@tonconnect/protocol";
import { sendTonConnectResponse } from "../../api/sendTonConnectResponse";
import { useDeleteActiveRemoteRequests } from "./useDeleteActiveRemoteRequests";
import { SignDataPayload, SignDataRawRequest, SignDataRequest } from '../../tonconnect/types';
import { ConnectedApp } from "./useTonConnectExtenstions";
import { Toaster } from "../../../components/toast/ToastProvider";
import { t } from "../../../i18n/t";
import { checkTonconnectSignRequest } from "../../tonconnect/checkTonconnectSignRequest";
import { saveErrorLog } from "../../../storage";

export type PreparedConnectSignRequest = {
  request: SignDataRequest,
  sessionCrypto: SessionCrypto,
  app: ConnectedApp,
  from?: string
}

// check if the request is valid and prepare the request for sign fragment navigation
export function usePrepareConnectSignRequest(config: { toaster: Toaster, toastProps?: { marginBottom: number } }): (request: SignDataRawRequest) => PreparedConnectSignRequest | undefined {
  const findConnectedAppByClientSessionId = useConnectAppByClientSessionId();
  const deleteActiveRemoteRequest = useDeleteActiveRemoteRequests();
  const { toaster, toastProps } = config;

  return (request: SignDataRawRequest) => {
    const params = JSON.parse(request.params[0]) as SignDataPayload;

    const { session } = findConnectedAppByClientSessionId(request.from);

    if (!session) {
      deleteActiveRemoteRequest(request.from);
      return;
    }

    const sessionCrypto = new SessionCrypto(session.sessionKeyPair);
    const toasterErrorProps: { type: 'error', marginBottom?: number } = { type: 'error', marginBottom: toastProps?.marginBottom };

    const deleteAndReportError = async (message: string, code: SEND_TRANSACTION_ERROR_CODES, toastMessage: string) => {
      // remove request from active requests locally
      deleteActiveRemoteRequest(request.from);

      // show error message to the user
      toaster.show({ ...toasterErrorProps, message: toastMessage });

      // send error response to the dApp client
      try {
        await sendTonConnectResponse({
          response: { error: { code, message }, id: request.id.toString() },
          sessionCrypto,
          clientSessionId: request.from
        });
      } catch (error) {
        saveErrorLog({
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          url: 'usePrepareConnectSignRequest:sendTonConnectResponse'
        });
        toaster.push({
          ...toasterErrorProps,
          message: t('products.transactionRequest.failedToReportCanceled'),
        });
      }
    }

    const isValidRequest = checkTonconnectSignRequest(
      request.id,
      params,
      (response) => sendTonConnectResponse({ response, sessionCrypto, clientSessionId: request.from }),
      toaster
    );

    if (!isValidRequest) {
      deleteAndReportError(
        'Bad request',
        SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
        t('products.transactionRequest.invalidRequest')
      );
      return;
    }

    const { connectedApp } = findConnectedAppByClientSessionId(request.from);

    if (!connectedApp) { // should never happen
      deleteAndReportError(
        'Missing an app connection',
        SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
        'Missing an app connection'
      );
      return;
    }

    return {
      request: {
        method: 'signData',
        params: [params],
        id: request.id,
        from: request.from
      },
      sessionCrypto,
      app: connectedApp,
      from: request.from
    }
  }
}
