import { useRecoilCallback, useRecoilState } from "recoil";
import { ConnectedAppsMap, connectExtensionsMapAtom } from "../../state/tonconnect";
import { useSelectedAccount } from "../appstate";

export type ConnectedApp = {
  date: number,
  name: string,
  url: string,
  iconUrl: string,
  autoConnectDisabled: boolean,
  manifestUrl: string
}

export function useConnectExtensions(address?: string): [
  ConnectedAppsMap,
  (updater: (prev: ConnectedAppsMap) => ConnectedAppsMap) => void
] {
  const account = useSelectedAccount();
  const [fullMap, update] = useRecoilState(connectExtensionsMapAtom);

  const key = address ?? account?.addressString;
  const extensions = key ? fullMap[address ?? account!.addressString] : {};
  const setterUpdater = (updater: (prev: ConnectedAppsMap) => ConnectedAppsMap) => {
    update((state) => {
      if (!key) return state;
      const newState = { ...state };
      newState[key] = updater(newState[key] || {});
      return newState;
    });
  }

  return [extensions || {}, setterUpdater];
}

type Updater = (doc: { [key: string]: ConnectedApp }) => { [x: string]: ConnectedApp };

export function useSetTonConnectExtensions() {
  const callback = useRecoilCallback(({ set }) => (updater: (doc: { [key: string]: ConnectedApp }) => { [x: string]: ConnectedApp }, address: string) => {
    set(connectExtensionsMapAtom, (state) => {
      const newState = { ...state };
      newState[address] = updater(newState[address] || {});
      return newState;
    });
  });
  return (address: string, updater: Updater) => {
    callback(updater, address);
  };
}