import { SetterOrUpdater, useRecoilCallback, useRecoilState } from "recoil";
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
  const [value, update] = useRecoilState(connectExtensionsMapAtom);

  const extensions = value[address ?? account!.addressString];
  const setterUpdater = (updater: (prev: ConnectedAppsMap) => ConnectedAppsMap) => {
    update((state) => {
      const newState = { ...state };
      newState[address ?? account!.addressString] = updater(newState[address ?? account!.addressString] || {});
      return newState;
    });
  }

  return [extensions || {}, setterUpdater];
}

type Updater = (doc: { [key: string]: ConnectedApp }) => { [x: string]: ConnectedApp };

export function useSetTonConnectExtensions() {
  const callback = useRecoilCallback(({ set }) => (udater: (doc: { [key: string]: ConnectedApp }) => { [x: string]: ConnectedApp }, address: string) => {
    set(connectExtensionsMapAtom, (state) => {
      const newState = { ...state };
      newState[address] = udater(newState[address] || {});
      return newState;
    });
  });
  return (address: string, updater: Updater) => {
    callback(updater, address);
  };
}