import { atom, selector } from "recoil";
import { storagePersistence } from "../../storage/storage";
import { z } from "zod";
import { CHAIN } from "@tonconnect/protocol";
import { ConnectedApp } from "../hooks/dapps/useTonConnectExtenstions";
import { CONNECT_ITEM_ERROR_CODES, ConnectedAppConnection, ConnectedAppConnectionRemote, SendTransactionRequest, TonConnectBridgeType } from '../tonconnect/types';
import { selectedAccountSelector } from "./appState";
import { getCurrentAddressNullable } from "../../storage/appState";

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
    publicKey: z.string(),
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

function getConnectionsState(address?: string) {
  if (!address) {
    return {};
  }
  const stored = storagePersistence.getString(`${address}/${appConnectionsKey}`);
  if (!stored) {
    return {};
  }
  const parsed = connectedAppConnectionsMapCodec.safeParse(JSON.parse(stored));

  if (parsed.success) {
    return parsed.data;
  }

  return {};
}

function storeConnectionsState(state: { [key: string]: ConnectedAppConnection[] }, address?: string) {
  if (!!address) {
    storagePersistence.set(`${address}/${appConnectionsKey}`, JSON.stringify(state));
  }
}

function getConnectionsForCurrent() {
  const selected = getCurrentAddressNullable();
  const state = getConnectionsState(selected?.addressString);
  return state;
}

function storeConnectionsForCurrent(newValue: { [key: string]: ConnectedAppConnection[] }) {
  const selected = getCurrentAddressNullable();
  storeConnectionsState(newValue, selected?.addressString);
}

const connnectionsState = atom({
  key: 'tonconnect/connections/state',
  default: getConnectionsForCurrent(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      storeConnectionsForCurrent(newValue);
    })
  }]
});

export const connectionsSelector = selector<{ [key: string]: ConnectedAppConnection[] }>({
  key: 'tonconnect/connections/selector',
  get: ({ get }) => {
    const apps = get(connectExtensionsState);
    const state = get(connnectionsState);

    // filter connections that are not in apps
    const filtered = Object.keys(state).reduce((acc, key) => {
      if (apps[key]) {
        acc[key] = state[key];
      }
      return acc;
    }, {} as { [key: string]: ConnectedAppConnection[] });

    return filtered;
  },
  set: ({ set }, newValue) => {
    set(connnectionsState, newValue);
  },
});

function getPendingRequestsState(address?: string) {
  if (!address) {
    return [];
  }
  const stored = storagePersistence.getString(`${address}/${pendingRequestsKey}`);
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

function storePendingRequestsState(newState: SendTransactionRequest[], address?: string) {
  if (!!address) {
    storagePersistence.set(`${address}/${pendingRequestsKey}`, JSON.stringify(newState));
  }
}

function getPendingRequestsForCurrent() {
  const selected = getCurrentAddressNullable();
  const state = getPendingRequestsState(selected?.addressString);
  return state;
}

function storePendingRequestsForCurrent(newValue: SendTransactionRequest[]) {
  const selected = getCurrentAddressNullable();
  storePendingRequestsState(newValue, selected?.addressString);
}

const pendingRequestsState = atom({
  key: 'tonconnect/pendingRequests/state',
  default: getPendingRequestsForCurrent(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      storePendingRequestsForCurrent(newValue);
    })
  }]
});

export const pendingRequestsSelector = selector<SendTransactionRequest[]>({
  key: 'tonconnect/pendingRequests/selector',
  get: ({ get }) => {
    const connections = get(connectionsSelector);
    const state = get(pendingRequestsState);

    // filter requests that are not in connections
    const filtered = state.filter((request) => {
      const allConnections = Object.values(connections).flat();
      const remoteConnections = allConnections.filter((c) => c.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[];
      return remoteConnections.some((c) => c.clientSessionId === request.from);
    });

    return filtered;
  },
  set: ({ set }, newValue) => {
    set(pendingRequestsState, newValue);
  }
});

const connectExtensionsKey = 'tonconnect.extensions';

function getStoredConnectExtensions(address?: string) {
  if (!address) {
    return {};
  }

  const stored = storagePersistence.getString(`${address}/${connectExtensionsKey}`);

  if (!stored) {
    return {};
  }

  const parsed = z.record(z.object({
    date: z.number(),
    name: z.string(),
    url: z.string(),
    iconUrl: z.string(),
    autoConnectDisabled: z.boolean(),
    manifestUrl: z.string(),
  })).safeParse(JSON.parse(stored));

  if (parsed.success) {
    return parsed.data;
  }

  return {};
}

function storeConnectExtensions(newState: { [key: string]: ConnectedApp }, address?: string) {
  if (!!address) {
    storagePersistence.set(`${address}/${connectExtensionsKey}`, JSON.stringify(newState));
  }
}

function storeExtensionsForCurrent(newValue: { [key: string]: ConnectedApp }) {
  const selected = getCurrentAddressNullable();
  storeConnectExtensions(newValue, selected?.addressString);
}

export function loadExtensionsStored() {
  const selected = getCurrentAddressNullable();
  const state = getStoredConnectExtensions(selected?.addressString);
  return state;
}

export const connectExtensionsState = atom({
  key: 'tonconnect/extensions/state',
  default: loadExtensionsStored(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      storeExtensionsForCurrent(newValue);
    })
  }]
});

export const connectExtensionsSelector = selector<{ [key: string]: ConnectedApp }>({
  key: 'tonconnect/extensions/selector',
  get: ({ get }) => {
    const selected = get(selectedAccountSelector);
    if (!selected) {
      return {};
    }
    const state = get(connectExtensionsState);
    return state;
  },
  set: ({ set }, newValue) => {
    set(connectExtensionsState, newValue);
  }
});