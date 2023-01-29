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

// id: string; result: string | undefined; error: string | undefined

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
  id: string
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

export interface ConnectedAppsStore {
  connectedApps: {
    [chainName: string]: {
      [walletAddress: string]: {
        [domain: string]: ConnectedApp;
      };
    };
  };
  actions: {
    saveAppConnection: (
      chainName: 'mainnet' | 'testnet',
      walletAddress: string,
      appData: Omit<ConnectedApp, 'connections'>,
      connection: ConnectedAppConnection,
    ) => void;
    removeApp: (
      chainName: 'mainnet' | 'testnet',
      walletAddress: string,
      url: string,
    ) => void;
    removeInjectedConnection: (
      chainName: 'mainnet' | 'testnet',
      walletAddress: string,
      url: string,
    ) => void;
  };
}
