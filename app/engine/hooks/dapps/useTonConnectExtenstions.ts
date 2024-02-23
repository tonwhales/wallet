import { SetterOrUpdater, useRecoilCallback, useRecoilState } from "recoil";
import { ConnectedAppsMap, connectExtensionsFamily, connectExtensionsSelector } from "../../state/tonconnect";

export type ConnectedApp = {
  date: number,
  name: string,
  url: string,
  iconUrl: string,
  autoConnectDisabled: boolean,
  manifestUrl: string
}

export function useTonConnectExtensions(): [{ [key: string]: ConnectedApp; }, SetterOrUpdater<{ [key: string]: ConnectedApp }>] {
  const [value, update] = useRecoilState(connectExtensionsSelector);
  return [value || {}, update]
}

export function useTonConenectExtensions(address: string) {
  const [value, update] = useRecoilState(connectExtensionsFamily(address));
  return [value || {}, update];
}

type Updater = (doc: { [key: string]: ConnectedApp }) => { [x: string]: ConnectedApp };

export function useSetTonConnectExtensions() {
  const callback = useRecoilCallback(({ set }) => (udater: (doc: { [key: string]: ConnectedApp }) => { [x: string]: ConnectedApp }, address: string) => {
    set(connectExtensionsFamily(address), udater);
  })
  return (address: string, updater: Updater) => {
    callback(updater, address);
  };
}