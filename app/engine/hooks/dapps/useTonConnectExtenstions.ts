import { SetterOrUpdater, useRecoilState } from "recoil";
import { connectExtensionsSelector, connectExtensionsState } from "../../state/tonconnect";

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