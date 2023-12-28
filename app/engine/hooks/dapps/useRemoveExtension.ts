import { useExtensions } from "../../hooks/dapps/useExtensions";
import { extensionKey } from "./useAddExtension";

export function useRemoveExtension() {
    const [extensions, update] = useExtensions();

    return (url: string) => {
        const key = extensionKey(url);
        if (!extensions.installed[key]) {
            return;
        }

        update((doc) => {
            delete doc.installed[key];
        });
    }
}