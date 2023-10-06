import { useCloudValue } from "../basic/useCloudValue";

export type ConnectedApp = {
    date: number,
    name: string,
    url: string,
    iconUrl: string,
    autoConnectDisabled: boolean,
  }

export function useTonConnectExtensions() {
    return useCloudValue<{ installed: { [key: string]: ConnectedApp } }>('wallet.tonconnect.extensions.v1', (src) => { src.installed = {} });
}