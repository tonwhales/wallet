import { useCloudValue } from "../basic/useCloudValue";

export type CloudExtension = {
    url: string,
    date: number,
    title?: string | null,
    image?: { url: string, blurhash: string } | null
}

export function useExtensions() {
    return useCloudValue<{ installed: { [key: string]: CloudExtension } }>('wallet.extensions.v2', (src) => { src.installed = {} });
}