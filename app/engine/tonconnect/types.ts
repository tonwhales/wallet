import { RefObject } from 'react';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { AppRequest, ConnectEvent, ConnectEventError as IConnectEventError, ConnectRequest, CONNECT_EVENT_ERROR_CODES, DeviceInfo, RpcMethod, SendTransactionRpcResponseError, SEND_TRANSACTION_ERROR_CODES, WalletResponse, CHAIN, SendTransactionRpcRequest } from '@tonconnect/protocol';
import { KeyPair } from '@tonconnect/protocol';
import { ExtendedConnectItemReply } from './ConnectReplyBuilder';

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

export interface ConnectPushQuery {
  validUntil: number;
  from: string;
  to: string;
  message: string;
}

export type ReturnStrategy = 'back' | 'none' | string;

export interface SignRawMessage {
  address: string;
  amount: string; // (decimal string): number of nanocoins to send.
  payload?: string; // (string base64, optional): raw one-cell BoC encoded in Base64.
  stateInit?: string; // (string base64, optional): raw once-cell BoC encoded in Base64.
  extra_currency?: {
    [k: number]: string;
  }
}

export type SignRawTxParams = {
  valid_until?: number;
  messages: SignRawMessage[];
  network?: CHAIN;
  from?: string;
};

export type ConnectedAppConnectionRemote = {
  type: TonConnectBridgeType.Remote,
  sessionKeyPair: KeyPair,
  clientSessionId: string,
  replyItems: ExtendedConnectItemReply[],
}

export type ConnectedAppConnectionInjected = {
  type: TonConnectBridgeType.Injected,
  replyItems: ExtendedConnectItemReply[],
}

export type ConnectedAppConnection =
  | ConnectedAppConnectionRemote
  | ConnectedAppConnectionInjected;

export type SendTransactionRequest = SendTransactionRpcRequest & { from: string }

export type SignTextPayload = { type: 'text', text: string }
export type SignBinaryPayload = { type: 'binary', bytes: string }
export type SignCellPayload = { type: 'cell', schema: string, cell: string }
export type SignDataPayload = SignTextPayload | SignBinaryPayload | SignCellPayload
export type SignRpcRequest = { method: 'signData', params: [SignDataPayload], id: string }
export type SignDataRequest = SignRpcRequest & { from: string }

export type SignDataRawRequest = { method: 'signData', params: [string], from: string, id: string }

export type PendingTonconnectRequest = SendTransactionRequest | SignDataRawRequest

export type TonConnectExtension = {
  key: string;
  url: string;
  name: string;
  image: string | null;
  termsOfUseUrl: string | null;
  privacyPolicyUrl: string | null;
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
  id: IConnectEventError['id'];

  constructor(code = CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR, message: string, id: number) {
    this.event = 'connect_error';
    this.payload = {
      code,
      message,
    };
    this.id = id;
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
