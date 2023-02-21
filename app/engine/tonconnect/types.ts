import { RefObject } from 'react';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import {
  ConnectEventError as IConnectEventError,
  CONNECT_EVENT_ERROR_CODES,
} from '@tonconnect/protocol';
import { CHAIN, ConnectItemReply, KeyPair } from '@tonconnect/protocol';
import * as t from 'io-ts';
import * as c from '../utils/codecs';

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


export const tonProofItemReplyErrorCodec = t.type({
  name: t.literal('ton_proof'),
  error: t.intersection([
    t.type({
      code: c.createEnumType<CONNECT_ITEM_ERROR_CODES>(CONNECT_ITEM_ERROR_CODES, 'CONNECT_ITEM_ERROR_CODES'),
    }),
    t.partial({
      message: t.union([t.string, t.undefined]),
    })
  ])
});

export const tonProofItemReplyCodec = t.union([
  t.type({
    name: t.literal('ton_proof'),
    proof: t.type({
      timestamp: t.number,
      domain: t.type({
        lengthBytes: t.number,
        value: t.string
      }),
      payload: t.string,
      signature: t.string,
    })
  }),
  tonProofItemReplyErrorCodec
]);

export const connectItemReplyCodec = t.union([
  t.type({
    name: t.literal('ton_addr'),
    address: t.string,
    network: c.createEnumType<CHAIN>(CHAIN, 'CHAIN'),
    walletStateInit: t.string,
  }),
  tonProofItemReplyCodec,
]);

export const appConnectionCodec = t.union([
  t.type({
    type: t.literal('remote'),
    sessionKeyPair: t.type({
      publicKey: t.string,
      secretKey: t.string,
    }),
    clientSessionId: t.string,
    replyItems: t.array(connectItemReplyCodec)
  }),
  t.type({
    type: t.literal('injected'),
    replyItems: t.array(connectItemReplyCodec)
  }),
]);

export type SendTransactionRequest = {
  method: 'sendTransaction',
  params: string[],
  id: string,
  from: string
}

export const sendTransactionRpcRequestCodec = t.type({
  method: t.literal('sendTransaction'),
  params: t.array(t.string),
  id: t.string,
  from: t.string
});

export const RpcRequestCodec = t.type({
  sendTransaction: sendTransactionRpcRequestCodec
});

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
