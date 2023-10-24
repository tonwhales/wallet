import { SetterOrUpdater, useRecoilValue, useSetRecoilState } from "recoil";
import { connectExtensions } from "../../state/tonconnect";

export type ConnectedApp = {
  date: number,
  name: string,
  url: string,
  iconUrl: string,
  autoConnectDisabled: boolean,
  manifestUrl: string
}

export function useTonConnectExtensions(): [{ [key: string]: ConnectedApp; }, SetterOrUpdater<{ [key: string]: ConnectedApp }>] {
  const value = useRecoilValue(connectExtensions);
  const update = useSetRecoilState(connectExtensions);

  console.log('useTonConnectExtensions', value);
  return [value || {}, update];
}