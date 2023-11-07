import { useExtensions } from "../../hooks/dapps/useExtensions";
import { extensionKey } from "./useAddExtension";

export function useRemoveExtension() {
    const [extensions, update] = useExtensions();

    return (url: string) => {
        console.log('useRemoveExtension', url);
        const key = extensionKey(url);
        console.log('useRemoveExtension', key);
        if (!extensions.installed[key]) {
            return;
        }
        
        console.log('deleting...', key);

        update((doc) => {
            delete doc.installed[key];
        });
    }
}