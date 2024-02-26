import { atom, atomFamily, selector, selectorFamily } from "recoil";
import { storagePersistence } from "../../storage/storage";
import { z } from "zod";
import { CHAIN } from "@tonconnect/protocol";
import { ConnectedApp } from "../hooks/dapps/useTonConnectExtenstions";
import { CONNECT_ITEM_ERROR_CODES, ConnectedAppConnection, ConnectedAppConnectionRemote, SendTransactionRequest, TonConnectBridgeType } from '../tonconnect/types';
import { selectedAccountSelector } from "./appState";
import { getAppState, getCurrentAddressNullable } from "../../storage/appState";

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

function storeConnectionsState(address: string, state: { [key: string]: ConnectedAppConnection[] }) {
  storagePersistence.set(`${address}/${appConnectionsKey}`, JSON.stringify(state));
}

export type ConnectionsMap = { [appKey: string]: ConnectedAppConnection[] }
export type FullConnectionsMap = { [address: string]: ConnectionsMap }

const connectionsMapAtom = atom<FullConnectionsMap>({
  key: 'tonconnect/connections/map',
  default: (() => {
    let res: FullConnectionsMap = {};
    const appState = getAppState();

    if (!appState) {
      return res;
    }

    for (const address of appState.addresses) {
      res[address.addressString] = getConnectionsState(address.addressString);
    }

    return res;
  })(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      for (const address in newValue) {
        storeConnectionsState(address, newValue[address]);
      }
    });
  }]
});

export const connectionsFamily = selectorFamily<ConnectionsMap, string>({
  key: 'tonconnect/connections/family',
  get: (address: string) => ({ get }) => {
    const state = get(connectionsMapAtom);
    return state[address] || {};
  },
  set: (address: string) => ({ set, get }, newValue) => {
    const currentState = get(connectionsMapAtom);
    const newState: FullConnectionsMap = { ...currentState, [address]: newValue as ConnectionsMap };
    set(connectionsMapAtom, newState);
  }
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

function storePendingRequestsState(address: string, newState: SendTransactionRequest[]) {
  storagePersistence.set(`${address}/${pendingRequestsKey}`, JSON.stringify(newState));
}

export type SendTransactionRequestsMap = { [address: string]: SendTransactionRequest[] }

const pendingRequestsState = atom<SendTransactionRequestsMap>({
  key: 'tonconnect/pendingRequests/state',
  default: (() => {
    const appState = getAppState();
    if (!appState) {
      return {};
    }

    const res: SendTransactionRequestsMap = {};

    for (const address of appState.addresses) {
      res[address.addressString] = getPendingRequestsState(address.addressString);
    }

    return res;
  })(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      for (const address in newValue) {
        storePendingRequestsState(address, newValue[address]);
      }
    })
  }]
});

export const pendingRequestsFamily = selectorFamily<SendTransactionRequest[], string>({
  key: 'tonconnect/pendingRequests/family',
  get: (address: string) => ({ get }) => {
    const state = get(pendingRequestsState);
    return state[address] || {};
  },
  set: (address: string) => ({ set, get }, newValue) => {
    const currentState = get(pendingRequestsState);
    const newState: SendTransactionRequestsMap = { ...currentState, [address]: newValue as SendTransactionRequest[] };
    set(pendingRequestsState, newState);
  }
});

export const pendingRequestsSelector = selector<SendTransactionRequest[]>({
  key: 'tonconnect/pendingRequests/selector',
  get: ({ get }) => {
    const currentAccount = get(selectedAccountSelector);
    const key = currentAccount?.addressString ?? ''
    const connections = get(connectionsFamily(key));
    const state = get(pendingRequestsFamily(key));

    // filter requests that are not in connections
    const filtered = state.filter((request) => {
      const allConnections = Object.values(connections).flat();
      const remoteConnections = allConnections.filter((c) => c.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[];
      return remoteConnections.some((c) => c.clientSessionId === request.from);
    });

    return filtered;
  },
  set: ({ set, get }, newValue) => {
    const currentAccount = get(selectedAccountSelector);
    set(pendingRequestsFamily(currentAccount?.addressString ?? ''), newValue);
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

export type ConnectedAppsMap = { [appKey: string]: ConnectedApp }
export type FullExtensionsMap = { [address: string]: ConnectedAppsMap }

const connectExtensionsMapAtom = atom<FullExtensionsMap>({
  key: 'tonconnect/extensions/map',
  default: (() => {
    let res: FullExtensionsMap = {};
    const appState = getAppState();
    if (!appState) {
      return res;
    }

    for (const address of appState.addresses) {
      res[address.addressString] = getStoredConnectExtensions(address.addressString);
    }

    return res;
  })(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      for (const address in newValue) {
        storeConnectExtensions(newValue[address], address);
      }
    });
  }]
});

export const connectExtensionsFamily = selectorFamily<ConnectedAppsMap, string>({
  key: 'tonconnect/extensions/family',
  get: (address: string) => ({ get }) => {
    const state = get(connectExtensionsMapAtom);
    return state[address] || {};
  },
  set: (address: string) => ({ set, get }, newValue) => {
    const currentState = get(connectExtensionsMapAtom);
    const newState: FullExtensionsMap = { ...currentState, [address]: newValue as ConnectedAppsMap };
    set(connectExtensionsMapAtom, newState);
  }
});