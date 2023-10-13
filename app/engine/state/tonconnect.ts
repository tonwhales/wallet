import { atom } from "recoil";
import { storagePersistence } from "../../storage/storage";
import { z } from "zod";
import { CONNECT_ITEM_ERROR_CODES, ConnectedAppConnection, SendTransactionRequest, TonConnectBridgeType } from "../legacy/tonconnect/types";
import { CHAIN } from "@tonconnect/protocol";
import { ConnectedApp } from "../hooks/dapps/useTonConnectExtenstions";

const appConnectionsKey = 'connectConnectedApps';
const pendingRequestsKey = 'connectPendingRequests';

const tonProofItemReplyErrorCodec = z.object({
  name: z.literal('ton_proof'),
  error: z.object({
    code: z.union([z.literal(CONNECT_ITEM_ERROR_CODES.UNKNOWN_ERROR), z.literal(CONNECT_ITEM_ERROR_CODES.METHOD_NOT_SUPPORTED)]),
    message: z.string().optional(),
  }),
});

const tonProofItemReplyCodec = z.union([
  z.object({
    name: z.literal('ton_proof'),
    proof: z.object({
      timestamp: z.number(),
      domain: z.object({
        lengthBytes: z.number(),
        value: z.string(),
      }),
      payload: z.string(),
      signature: z.string(),
    }),
  }),
  tonProofItemReplyErrorCodec,
]);

const connectItemReplyCodec = z.union([
  z.object({
    name: z.literal('ton_addr'),
    address: z.string(),
    network: z.union([z.literal(CHAIN.MAINNET), z.literal(CHAIN.TESTNET)]),
    walletStateInit: z.string(),
  }),
  tonProofItemReplyCodec,
]);

const appConnectionCodec = z.union([
  z.object({
    type: z.literal(TonConnectBridgeType.Remote),
    sessionKeyPair: z.object({
      publicKey: z.string(),
      secretKey: z.string(),
    }),
    clientSessionId: z.string(),
    replyItems: z.array(connectItemReplyCodec),
  }),
  z.object({
    type: z.literal(TonConnectBridgeType.Injected),
    replyItems: z.array(connectItemReplyCodec),
  }),
]);

const connectedAppConnectionsCodec = z.array(appConnectionCodec);

const connectedAppConnectionsMapCodec = z.record(connectedAppConnectionsCodec);

function getConnectionsState() {
  const stored = storagePersistence.getString(appConnectionsKey);
  if (!stored) {
    return {};
  }
  const parsed = connectedAppConnectionsMapCodec.safeParse(JSON.parse(stored));

  if (parsed.success) {
    return parsed.data;
  }

  return {};
}

function storeConnectionsState(state: { [key: string]: ConnectedAppConnection[] }) {
  storagePersistence.set(appConnectionsKey, JSON.stringify(state));
}

export const appsConnectionsState = atom<{ [key: string]: ConnectedAppConnection[] }>({
  key: 'tonconnect/connections',
  default: getConnectionsState(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      storeConnectionsState(newValue);
    })
  }]
});

function getPendingRequestsState() {
  const stored = storagePersistence.getString(pendingRequestsKey);
  if (!stored) {
    return [];
  }
  const parsed = z.array(z.object({
    method: z.literal('sendTransaction'),
    params: z.array(z.string()),
    id: z.string(),
    from: z.string(),
  })).safeParse(JSON.parse(stored));

  if (parsed.success) {
    return parsed.data;
  }

  return [];
}

function storePendingRequestsState(newState: SendTransactionRequest[]) {
  storagePersistence.set(pendingRequestsKey, JSON.stringify(newState));
}

export const pendingRequestsState = atom<SendTransactionRequest[]>({
  key: 'tonconnect/pendingRequests',
  default: getPendingRequestsState(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      storePendingRequestsState(newValue);
    })
  }]
});

export const connectExtensions = atom<{ [key: string]: ConnectedApp }>({
  key: 'tonconnect/extensions',
  default: {},
  effects_UNSTABLE: [({ onSet }) => {
    onSet((newValue) => {
      storagePersistence.set('wallet.tonconnect.extensions.v2', JSON.stringify(newValue));
    })
  }]
})