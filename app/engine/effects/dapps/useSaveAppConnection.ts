import { queryClient } from "../../clients";
import { useTonConnectExtensions } from "../../hooks/dapps/useTonConnectExtenstions";
import { ConnectedAppConnection } from "../../legacy/tonconnect/types";
import { Queries } from "../../queries";
import { extensionKey } from "./useAddExtension";
import { useSetAppsConnectionsState } from "./useSetTonconnectConnections";

export function useSaveAppConnection() {
    const [extensions, update] = useTonConnectExtensions();
    const setConnections = useSetAppsConnectionsState();
    return ({
        app,
        connection
    }: {
        app: { url: string, name: string, iconUrl: string, autoConnectDisabled: boolean },
        connection: ConnectedAppConnection
    }) => {
        let key = extensionKey(app.url);
        const connected = extensions.installed[key];
        if (!!connected) {
            update((doc) => {
                doc.installed[key].iconUrl = app.iconUrl;
                doc.installed[key].name = app.name;
                doc.installed[key].date = Date.now();
                doc.installed[key].autoConnectDisabled = app.autoConnectDisabled;
            });
        } else {
            update((doc) => {
                delete doc.installed[key];
                doc.installed[key] = {
                    url: app.url,
                    iconUrl: app.iconUrl,
                    name: app.name,
                    date: Date.now(),
                    autoConnectDisabled: app.autoConnectDisabled,
                }
            });
        }

        setConnections((prev) => {
            console.log(prev);
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
        })
    }

}