import { SetterOrUpdater, useRecoilCallback, useRecoilState } from "recoil";
import { ConnectedAppsMap, connectExtensionsFamily } from "../../state/tonconnect";
import { useSelectedAccount } from "../appstate";

export type ConnectedApp = {
  date: number,
  name: string,
  url: string,
  iconUrl: string,
  autoConnectDisabled: boolean,
  manifestUrl: string
}

export function useTonConnectExtensions(address?: string): [ConnectedAppsMap, SetterOrUpdater<ConnectedAppsMap>] {
  const account = useSelectedAccount();
  const [value, update] = useRecoilState(connectExtensionsFamily(address ?? account!.addressString));
  return [value || {}, update];
}

type Updater = (doc: { [key: string]: ConnectedApp }) => { [x: string]: ConnectedApp };

export function useSetTonConnectExtensions() {
  const callback = useRecoilCallback(({ set }) => (udater: (doc: { [key: string]: ConnectedApp }) => { [x: string]: ConnectedApp }, address: string) => {
    set(connectExtensionsFamily(address), udater);
  });
  return (address: string, updater: Updater) => {
    callback(updater, address);
  };
}