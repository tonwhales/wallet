import { useTonConnectExtensions } from "../../hooks/dapps/useTonConnectExtenstions";
import { extensionKey } from "./useAddExtension";

export function useRemoveConnectApp() {
    const [, update] = useTonConnectExtensions();

    return (url: string) => {
        update((doc) => {
            doc.installed
            let key = extensionKey(url);

            if (!doc.installed[key]) {
                return;
            }
            delete doc.installed[key];
        });
    }
}