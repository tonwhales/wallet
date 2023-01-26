
import {
  findConnectedAppByClientSessionId,
  findConnectedAppByUrl,
  IConnectedApp,
  saveAppConnection,
  removeConnectedApp,
  store,
  TonConnectBridgeType,
  IConnectedAppConnectionRemote,
} from '$store';
import {
  AppRequest,
  Base64,
  ConnectEvent,
  ConnectRequest,
  CONNECT_EVENT_ERROR_CODES,
  DisconnectEvent,
  hexToByteArray,
  RpcMethod,
  SEND_TRANSACTION_ERROR_CODES,
  SessionCrypto,
  WalletResponse,
} from '@tonconnect/protocol';
import axios from 'axios';
import { MIN_PROTOCOL_VERSION, tonConnectDeviceInfo } from './config';
import { ConnectEventError } from './errors/ConnectEventError';
import { ConnectReplyBuilder } from './ConnectReplyBuilder';
import { SendTransactionError } from './errors/SendTransactionError';
import { TonConnectRemoteBridge } from './TonConnectRemoteBridge';
import { AppManifest } from './fetchManifest';
import { warn } from '../../utils/log';

export interface IConnectQrQuery {
  v: string;
  r: string;
  id: string;
  ret: ReturnStrategy;
}

export type ReturnStrategy = 'back' | 'none' | string;


class TonConnectService {
  private readonly defaultTtl = 300;
  
  checkProtocolVersionCapability(protocolVersion: number) {
    if (typeof protocolVersion !== 'number' || protocolVersion < MIN_PROTOCOL_VERSION) {
      throw new ConnectEventError(
        CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR,
        `Protocol version ${String(protocolVersion)} is not supported by the wallet app`,
      );
    }
  }

  verifyConnectRequest(request: ConnectRequest) {
    if (!(request && request.manifestUrl && request.items?.length)) {
      throw new ConnectEventError(
        CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR,
        'Wrong request data',
      );
    }
  }

  private async send<T extends RpcMethod>(
    bridgeUrl: string,
    response: WalletResponse<T> | ConnectEvent | DisconnectEvent,
    sessionCrypto: SessionCrypto,
    clientSessionId: string,
    ttl?: number,
  ): Promise<void> {
    try {
      const url = `${bridgeUrl}/message?client_id=${
        sessionCrypto.sessionId
      }&to=${clientSessionId}&ttl=${ttl || this.defaultTtl}`;

      const encodedResponse = sessionCrypto.encrypt(
        JSON.stringify(response),
        hexToByteArray(clientSessionId),
      );

      await axios.post(url, Base64.encode(encodedResponse));

      // await fetch(url, {
      //   body: Base64.encode(encodedResponse),
      //   method: 'POST',
      // });
    } catch (e) {
      console.log('send fail', e);
    }
  }

  async connect({
    protocolVersion,
    request,
    sessionCrypto,
    clientSessionId,
    webViewUrl,
    manifest
  }: {
    protocolVersion: number,
    request: ConnectRequest,
    sessionCrypto?: SessionCrypto,
    clientSessionId?: string,
    webViewUrl?: string,
    manifest: AppManifest
  }): Promise<ConnectEvent> {
    try {
      this.checkProtocolVersionCapability(protocolVersion);

      this.verifyConnectRequest(request);

      try {
        const { address, replyItems } = await new Promise<TonConnectModalResponse>(
          (resolve, reject) =>
            openTonConnect({
              protocolVersion: protocolVersion as 2,
              manifest,
              replyBuilder: new ConnectReplyBuilder(request, manifest),
              requestPromise: { resolve, reject },
              hideImmediately: !!webViewUrl,
            }),
        );

        saveAppConnection(
          address,
          {
            name: manifest.name,
            url: manifest.url,
            icon: manifest.iconUrl,
          },
          webViewUrl
            ? { type: TonConnectBridgeType.Injected, replyItems }
            : {
              type: TonConnectBridgeType.Remote,
              sessionKeyPair: sessionCrypto!.stringifyKeypair(),
              clientSessionId: clientSessionId!,
              replyItems,
            },
        );

        return {
          event: 'connect',
          payload: {
            items: replyItems,
            device: tonConnectDeviceInfo,
          },
        };
      } catch {
        throw new ConnectEventError(
          CONNECT_EVENT_ERROR_CODES.USER_REJECTS_ERROR,
          'Wallet declined the request',
        );
      }
    } catch (error) {
      if (error instanceof ConnectEventError) {
        return error;
      }

      return new ConnectEventError(
        CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
        error?.message,
      );
    }
  }

  /**
   * Only for injected ton-connect bridge
   */
  async autoConnect(webViewUrl: string): Promise<ConnectEvent> {
    try {
      const connectedApp = findConnectedAppByUrl(webViewUrl);

      if (
        !connectedApp ||
        connectedApp.connections.length === 0 ||
        connectedApp.autoConnectDisabled
      ) {
        throw new ConnectEventError(
          CONNECT_EVENT_ERROR_CODES.UNKNOWN_APP_ERROR,
          'Unknown app',
        );
      }

      const state = store.getState();
      const currentWalletAddress = state.wallet?.address?.ton;

      let walletStateInit = '';
      try {
        if (state.wallet?.wallet) {
          const tonWallet = state.wallet.wallet.vault.tonWallet;
          const { stateInit } = await tonWallet.createStateInit();
          walletStateInit = TonWeb.utils.bytesToBase64(await stateInit.toBoc(false));
        }
      } catch (err) {
        warn(err);
      }

      const replyItems = ConnectReplyBuilder.createAutoConnectReplyItems(
        currentWalletAddress,
        walletStateInit,
      );

      return {
        event: 'connect',
        payload: {
          items: replyItems,
          device: tonConnectDeviceInfo,
        },
      };
    } catch (error) {
      if (error instanceof ConnectEventError) {
        return error;
      }

      return new ConnectEventError(
        CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
        error?.message,
      );
    }
  }

  async sendTransaction(
    request: AppRequest<'sendTransaction'>,
  ): Promise<WalletResponse<'sendTransaction'>> {
    try {
      const params = JSON.parse(request.params[0]) as SignRawParams;

      const isValidRequest =
        params &&
        typeof params.valid_until === 'number' &&
        Array.isArray(params.messages) &&
        params.messages.every((msg) => !!msg.address && !!msg.amount);

      if (!isValidRequest) {
        throw new SendTransactionError(
          request.id,
          SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
          'Bad request',
        );
      }

      const { valid_until, messages } = params;

      if (valid_until < getTimeSec()) {
        throw new SendTransactionError(
          request.id,
          SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
          'Request timed out',
        );
      }

      const currentWalletAddress = store.getState().wallet?.address?.ton;

      const txParams: SignRawParams = {
        valid_until,
        messages,
        source: currentWalletAddress,
      };

      const boc = await new Promise<string>(async (resolve, reject) => {
        if (!checkIsTimeSynced()) {
          return reject(
            new SendTransactionError(
              request.id,
              SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
              'Wallet declined the request',
            ),
          );
        }
        const openModalResult = await openSignRawModal(
          txParams,
          {
            expires_sec: valid_until,
            response_options: {
              broadcast: false,
            },
          },
          resolve,
          () =>
            reject(
              new SendTransactionError(
                request.id,
                SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                'Wallet declined the request',
              ),
            ),
        );

        if (!openModalResult) {
          reject(
            new SendTransactionError(
              request.id,
              SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
              'Open transaction modal failed',
            ),
          );
        }
      });

      return {
        result: boc,
        id: request.id,
      };
    } catch (error) {
      if (error instanceof SendTransactionError) {
        return error;
      }

      return new SendTransactionError(
        request.id,
        SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
        error?.message,
      );
    }
  }

  private async handleRequest<T extends RpcMethod>(
    request: AppRequest<T>,
    connectedApp: IConnectedApp | null,
  ): Promise<WalletResponse<T>> {
    if (!connectedApp) {
      return {
        error: {
          code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
          message: 'Unknown app',
        },
        id: request.id,
      };
    }

    if (request.method === 'sendTransaction') {
      return this.sendTransaction(request);
    }

    return {
      error: {
        code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
        message: `Method "${request.method}" does not supported by the wallet app`,
      },
      id: request.id,
    };
  }

  async handleRequestFromInjectedBridge<T extends RpcMethod>(
    request: AppRequest<T>,
    webViewUrl: string,
  ): Promise<WalletResponse<T>> {
    const connectedApp = findConnectedAppByUrl(webViewUrl);

    return this.handleRequest(request, connectedApp);
  }

  async handleRequestFromRemoteBridge<T extends RpcMethod>(
    request: AppRequest<T>,
    clientSessionId: string,
  ): Promise<WalletResponse<T>> {
    const { connectedApp } = findConnectedAppByClientSessionId(clientSessionId);

    return this.handleRequest(request, connectedApp);
  }

  async disconnect(url: string) {
    const connectedApp = findConnectedAppByUrl(url);

    if (!connectedApp) {
      return;
    }

    const remoteConnections = connectedApp.connections.filter(
      (connection) => connection.type === TonConnectBridgeType.Remote,
    ) as IConnectedAppConnectionRemote[];

    remoteConnections.forEach((connection) =>
      TonConnectRemoteBridge.sendDisconnectEvent(connection),
    );

    removeConnectedApp(url);
  }
}

export const TonConnect = new TonConnectService();
