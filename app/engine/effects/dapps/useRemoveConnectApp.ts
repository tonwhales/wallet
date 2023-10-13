import { useTonConnectExtensions } from "../../hooks/dapps/useTonConnectExtenstions";
import { extensionKey } from "./useAddExtension";

export function useRemoveConnectApp() {
    const [, update] = useTonConnectExtensions();

    return (url: string) => {
        update((doc) => {
            let temp = { ...doc };
            let key = extensionKey(url);

            if (!temp[key]) {
                return doc;
            }
            delete temp[key];
            return temp;
        });
    }
}