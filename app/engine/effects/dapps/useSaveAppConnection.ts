import { useTonConnectExtensions } from "../../hooks/dapps/useTonConnectExtenstions";
import { ConnectedAppConnection } from "../../legacy/tonconnect/types";
import { extensionKey } from "./useAddExtension";
import { useSetAppsConnectionsState } from "./useSetTonconnectConnections";

export function useSaveAppConnection() {
    const [extensions, update] = useTonConnectExtensions();
    const setConnections = useSetAppsConnectionsState();
    return async ({
        app,
        connection
    }: {
        app: { url: string, name: string, iconUrl: string, autoConnectDisabled: boolean, manifestUrl: string },
        connection: ConnectedAppConnection
    }) => {
        let key = extensionKey(app.url);
        const connected = extensions[key];
        if (!!connected) {
            update((doc) => {
                let temp = { ...doc };

                temp[key].iconUrl = app.iconUrl;
                temp[key].name = app.name;
                temp[key].date = Date.now();
                temp[key].autoConnectDisabled = app.autoConnectDisabled;
                temp[key].manifestUrl = app.manifestUrl;

                return temp;
            });
        } else {
            await update((doc) => {
                let temp = { ...doc };

                delete temp[key];
                temp[key] = {
                    url: app.url,
                    iconUrl: app.iconUrl,
                    name: app.name,
                    date: Date.now(),
                    autoConnectDisabled: app.autoConnectDisabled,
                    manifestUrl: app.manifestUrl
                }

                return temp;
            });
        }

        setConnections((prev) => {
            if (prev[key]) {
                return {
                    ...prev,
                    [key]: [...prev[key], connection]
                }
            }
            return {
                ...prev,
                [key]: [connection]
            }
        });
    }

}