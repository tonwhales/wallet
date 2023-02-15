import { RefObject } from 'react';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { CHAIN, ConnectItemReply, KeyPair } from '@tonconnect/protocol';
import * as t from 'io-ts';

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

export interface ConnectedAppConnectionRemote {
  type: TonConnectBridgeType.Remote;
  sessionKeyPair: KeyPair;
  clientSessionId: string;
  replyItems: ConnectItemReply[];
}

export interface ConnectedAppConnectionInjected {
  type: TonConnectBridgeType.Injected;
  replyItems: ConnectItemReply[];
}

export type ConnectedAppConnection =
  | ConnectedAppConnectionRemote
  | ConnectedAppConnectionInjected;

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
  t.type({
    name: t.literal('ton_proof'),
    error: t.partial({
      code: t.union([t.literal(0), t.literal(400)]),
      message: t.union([t.string, t.undefined]),
    })
  })
]);

export const connectItemReplyCodec = t.union([
  t.type({
    name: t.literal('ton_addr'),
    address: t.string,
    network: t.union([t.literal(CHAIN.MAINNET), t.literal(CHAIN.TESTNET)]),
    walletStateInit: t.string,
  }),
  tonProofItemReplyCodec,
]);

export const tonConnectappDataCodec = t.type({
  name: t.string,
  url: t.string,
  icon: t.string,
  autoConnectDisabled: t.union([t.boolean, t.undefined]),
  connections: t.array(
    t.union([
      t.type({
        type: t.literal(TonConnectBridgeType.Remote),
        sessionKeyPair: t.type({
          publicKey: t.string,
          secretKey: t.string,
        }),
        clientSessionId: t.string,
        replyItems: t.array(connectItemReplyCodec)
      }),
      t.type({
        type: t.literal(TonConnectBridgeType.Injected),
        replyItems: t.array(connectItemReplyCodec)
      }),
    ]),
  ),
});

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

export interface ConnectedApp {
  name: string;
  url: string;
  icon: string;
  autoConnectDisabled?: boolean | undefined;
  connections: ConnectedAppConnection[];
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

import {
  ConnectEventError as IConnectEventError,
  CONNECT_EVENT_ERROR_CODES,
} from '@tonconnect/protocol';

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
