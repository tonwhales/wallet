import { useConnectAppByClientSessionId } from "../../hooks/dapps/useConnectApp";
import { CHAIN, SEND_TRANSACTION_ERROR_CODES, SessionCrypto } from "@tonconnect/protocol";
import { sendTonConnectResponse } from "../../api/sendTonConnectResponse";
import { getTimeSec } from "../../../utils/getTimeSec";
import { warn } from "../../../utils/log";
import { Address, Cell, fromNano, toNano } from "@ton/core";
import { useDeleteActiveRemoteRequests } from "./useDeleteActiveRemoteRequests";
import { SendTransactionRequest, SignRawParams } from '../../tonconnect/types';
import { ConnectedApp } from "./useTonConnectExtenstions";
import { Toaster } from "../../../components/toast/ToastProvider";
import { getCurrentAddress } from "../../../storage/appState";
import { t } from "../../../i18n/t";

export type PreparedConnectRequest = {
  request: SendTransactionRequest,
  sessionCrypto: SessionCrypto,
  messages: {
    amount: bigint,
    target: string,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null
  }[],
  app: ConnectedApp | null,
  network?: CHAIN,
  from?: string
}

// check if the request is valid and prepare the request for transfer fragment navigation
export function usePrepareConnectRequest(config: { isTestnet: boolean, toaster: Toaster, toastProps?: { marginBottom: number } }): (request: { from: string } & SendTransactionRequest) => PreparedConnectRequest | undefined {
  const findConnectedAppByClientSessionId = useConnectAppByClientSessionId();
  const deleteActiveRemoteRequest = useDeleteActiveRemoteRequests();
  const { toaster, isTestnet, toastProps } = config;

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
    const toasterErrorProps: { type: 'error', marginBottom?: number } = { type: 'error', marginBottom: toastProps?.marginBottom };
    const walletNetwork = isTestnet ? CHAIN.TESTNET : CHAIN.MAINNET;

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
      } catch {
        toaster.push({
          ...toasterErrorProps,
          message: t('products.transactionRequest.failedToReportCanceled'),
        });
      }
    }

    let { valid_until, network, from } = params;

    // check if the network is the same as the current wallet network
    if (!!network) {
      if (network !== walletNetwork) {
        deleteAndReportError(
          'Invalid from address',
          SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
          t('products.transactionRequest.wrongNetwork')
        );
        return;
      }
    }

    // check if the from address is the same as the current wallet address
    if (!!from) {
      const current = getCurrentAddress();
      try {
        const fromAddress = Address.parse(from);

        if (!fromAddress.equals(current.address)) {
          deleteAndReportError(
            'Invalid from address',
            SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
            t('products.transactionRequest.wrongFrom')
          );
          return;
        }

      } catch {
        deleteAndReportError(
          'Invalid from address',
          SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
          t('products.transactionRequest.invalidFrom')
        );
        return;
      }
    }

    if (!isValidRequest) {
      deleteAndReportError(
        'Bad request',
        SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
        t('products.transactionRequest.invalidRequest')
      );
      return;
    }

    if (valid_until < getTimeSec()) {
      deleteAndReportError(
        'Request expired',
        SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
        t('products.transactionRequest.expired')
      );
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
      app: connectedApp,
      network,
      from
    }
  }
}
