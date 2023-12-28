import { toUrlSafe } from "../../../utils/toUrlSafe";
import { useExtensions } from "./useExtensions";
import { sha256_sync } from "@ton/crypto";

export function extensionKey(src: string) {
    return toUrlSafe(sha256_sync(src.toLocaleLowerCase().trim()).toString('base64'));
}

export function useAddExtension() {
    const [extensions, update] = useExtensions();

    return (url: string, title: string | null, image: { url: string, blurhash: string } | null) => {
        const key = extensionKey(url);
        if (extensions.installed[key]) {
            return;
        }

        update((doc) => {
            doc.installed[key] = {
                url,
                title: title ? title : null,
                image: image ? image : null,
                date: Math.floor((Date.now() / 1000))
            }
        })
    }
}