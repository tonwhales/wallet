import { useCloudValue } from "../basic/useCloudValue";

export type ConnectedApp = {
  date: number,
  name: string,
  url: string,
  iconUrl: string,
  autoConnectDisabled: boolean,
  manifestUrl?: string
}

const version = 2;

export function useTonConnectExtensions() {
  return useCloudValue<{ installed: { [key: string]: ConnectedApp } }>(`wallet.tonconnect.extensions.v${version}`, (src) => { src.installed = {} });
}