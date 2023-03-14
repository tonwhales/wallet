import { RefObject } from 'react';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { AppRequest, ConnectEvent, ConnectEventError as IConnectEventError, ConnectRequest, CONNECT_EVENT_ERROR_CODES, DeviceInfo, RpcMethod, SendTransactionRpcResponseError, SEND_TRANSACTION_ERROR_CODES, WalletResponse } from '@tonconnect/protocol';
import { ConnectItemReply, KeyPair } from '@tonconnect/protocol';
import * as t from 'io-ts';

export enum CONNECT_ITEM_ERROR_CODES {
  UNKNOWN_ERROR = 0,
  METHOD_NOT_SUPPORTED = 400
}

export enum TonConnectBridgeType {
  Remote = 'remote',
  Injected = 'injected',
}

export interface ConnectQrQuery {
  v: string;
  r: string;
  id: string;
  ret: ReturnStrategy;
}

export type ReturnStrategy = 'back' | 'none' | string;

export interface SignRawMessage {
  address: string;
  amount: string; // (decimal string): number of nanocoins to send.
  payload?: string; // (string base64, optional): raw one-cell BoC encoded in Base64.
  stateInit?: string; // (string base64, optional): raw once-cell BoC encoded in Base64.
}

export type SignRawParams = {
  valid_until: number;
  messages: SignRawMessage[];
};

export type ConnectedAppConnectionRemote = {
  type: TonConnectBridgeType.Remote,
  sessionKeyPair: KeyPair,
  clientSessionId: string,
  replyItems: ConnectItemReply[],
}

export type ConnectedAppConnectionInjected = {
  type: TonConnectBridgeType.Injected,
  replyItems: ConnectItemReply[],
}

export type ConnectedAppConnection =
  | ConnectedAppConnectionRemote
  | ConnectedAppConnectionInjected;

export type SendTransactionRequest = {
  method: 'sendTransaction',
  params: string[],
  id: string,
  from: string
}

export type TonConnectExtension = {
  key: string;
  url: string;
  name: string;
  image: string | null;
  termsOfUseUrl: string | null;
  privacyPolicyUrl: string | null;
}

export type ConnectedApp = {
  date: number,
  name: string,
  url: string,
  iconUrl: string,
  autoConnectDisabled: boolean,
}

export enum WebViewBridgeMessageType {
  invokeRnFunc = 'invokeRnFunc',
  functionResponse = 'functionResponse',
  event = 'event',
}

export interface WebViewBridgeMessage {
  type: string;
  invocationId: string;
  name: string;
  args: any[];
}

export type UseWebViewBridgeReturnType<Event> = [
  RefObject<WebView<{}>>,
  string,
  (e: WebViewMessageEvent) => void,
  (event: Event) => void,
];

export class ConnectEventError implements IConnectEventError {
  event: IConnectEventError['event'];
  payload: IConnectEventError['payload'];

  constructor(code = CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR, message: string) {
    this.event = 'connect_error';
    this.payload = {
      code,
      message,
    };
  }
}

export class SendTransactionError implements SendTransactionRpcResponseError {
  id: SendTransactionRpcResponseError['id'];
  error: SendTransactionRpcResponseError['error'];

  constructor(
    requestId: string,
    code: SEND_TRANSACTION_ERROR_CODES,
    message: string,
    data?: any,
  ) {
    this.id = requestId;
    this.error = {
      code,
      message,
      data,
    };
  }
}

export interface TonConnectInjectedBridge {
  deviceInfo: DeviceInfo;
  protocolVersion: number;
  isWalletBrowser: boolean;
  connect(
    protocolVersion: number,
    message: ConnectRequest,
    auto: boolean,
  ): Promise<ConnectEvent>;
  restoreConnection(): Promise<ConnectEvent>;
  disconnect(): Promise<void>;
  send<T extends RpcMethod>(message: AppRequest<T>): Promise<WalletResponse<T>>;
}
