import { atom, selector } from "recoil";
import { storagePersistence } from "../../storage/storage";
import { z } from "zod";
import { CHAIN } from "@tonconnect/protocol";
import { ConnectedApp } from "../hooks/dapps/useTonConnectExtenstions";
import { CONNECT_ITEM_ERROR_CODES, ConnectedAppConnection, ConnectedAppConnectionRemote, SendTransactionRequest, TonConnectBridgeType } from '../tonconnect/types';
import { selectedAccountSelector } from "./appState";
import { getAppState, getLedgerWallets } from "../../storage/appState";
import { getIsTestnet } from "./network";
import { Address } from "@ton/core";

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

export function getFullConnectionsMap() {
  let res: FullConnectionsMap = {};
  const appState = getAppState();

  if (!appState) {
    return res;
  }

  const isTestnet = getIsTestnet();

  for (const acc of appState.addresses) {
    const accString = acc?.address.toString({ testOnly: isTestnet }) || '';
    res[accString] = getConnectionsState(accString);
  }

  return res;
}

export const connectionsMapAtom = atom<FullConnectionsMap>({
  key: 'tonconnect/connections/map',
  default: getFullConnectionsMap(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      for (const address in newValue) {
        storeConnectionsState(address, newValue[address]);
      }
    });
  }]
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

function getSendTransactionRequestsMap() {
  const appState = getAppState();
  if (!appState) {
    return {};
  }

  const res: SendTransactionRequestsMap = {};

  const isTestnet = getIsTestnet();

  for (const acc of appState.addresses) {
    const accString = acc?.address.toString({ testOnly: isTestnet }) || '';
    res[accString] = getPendingRequestsState(accString);
  }

  return res;
}

const pendingRequestsState = atom<SendTransactionRequestsMap>({
  key: 'tonconnect/pendingRequests/state',
  default: getSendTransactionRequestsMap(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      for (const address in newValue) {
        storePendingRequestsState(address, newValue[address]);
      }
    })
  }]
});

export const pendingRequestsSelector = selector<SendTransactionRequest[]>({
  key: 'tonconnect/pendingRequests/selector',
  get: ({ get }) => {
    const currentAccount = get(selectedAccountSelector);

    if (!currentAccount) {
      return [];
    }

    const key = currentAccount.addressString || '';
    const connections = get(connectionsMapAtom)[key];
    const state = get(pendingRequestsState)[key];

    // filter requests that are not in connections
    const filtered = state?.filter?.((request) => {
      const allConnections = Object.values(connections).flat();
      const remoteConnections = allConnections.filter((c) => c.type === TonConnectBridgeType.Remote) as ConnectedAppConnectionRemote[];
      return remoteConnections.some((c) => c.clientSessionId === request.from);
    }) ?? [];

    return filtered;
  },
  set: ({ set, get }, newValue) => {
    const currentAccount = get(selectedAccountSelector);
    set(pendingRequestsState, (state) => {
      const key = currentAccount?.addressString || '';
      return { ...state, [key]: newValue as SendTransactionRequest[] };
    });
  }
});

const connectExtensionsKey = 'tonconnect.extensions';

export function getStoredConnectExtensions(address?: string): ConnectedAppsMap {
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

function storeConnectExtensions(newState: { [key: string]: ConnectedApp }, address: string) {
  storagePersistence.set(`${address}/${connectExtensionsKey}`, JSON.stringify(newState));
}

export type ConnectedAppsMap = { [appKey: string]: ConnectedApp }
export type FullExtensionsMap = { [address: string]: ConnectedAppsMap }

export function getFullExtensionsMap() {
  let res: FullExtensionsMap = {};
  const appState = getAppState();

  if (!appState) {
    return res;
  }

  const isTestnet = getIsTestnet();

  for (const acc of appState.addresses) {
    const accString = acc?.address.toString({ testOnly: isTestnet }) || '';
    res[accString] = getStoredConnectExtensions(accString);
  }

  const ledgerWallets = getLedgerWallets();

  for (const acc of ledgerWallets) {
    if (acc.address) {
      const address = Address.parse(acc.address).toString({ testOnly: isTestnet });
      res[address] = getStoredConnectExtensions(address);
    }
  }

  return res;
}

export const connectExtensionsMapAtom = atom<FullExtensionsMap>({
  key: 'tonconnect/extensions/map',
  default: getFullExtensionsMap(),
  effects: [({ onSet }) => {
    onSet((newValue) => {
      for (const address in newValue) {
        storeConnectExtensions(newValue[address], address);
      }
    });
  }]
});