import { useTonConnectExtensions } from "../../hooks/dapps/useTonConnectExtenstions";
import { ConnectedAppConnection } from '../../tonconnect/types';
import { extensionKey } from "./useAddExtension";
import { useSetAppsConnectionsState } from "./useSetTonconnectConnections";

export function useSaveAppConnection() {
    const [, updateExtensions] = useTonConnectExtensions();
    const setConnections = useSetAppsConnectionsState();
    return (async ({
        app,
        connections
    }: {
        app: { url: string, name: string, iconUrl: string, autoConnectDisabled: boolean, manifestUrl: string },
        connections: ConnectedAppConnection[]
    }) => {
        let key = extensionKey(app.url);

        updateExtensions((doc) => {
            let temp = { ...doc };
            if (!!doc[key]) {
                temp[key].iconUrl = app.iconUrl;
                temp[key].name = app.name;
                temp[key].date = Date.now();
                temp[key].autoConnectDisabled = app.autoConnectDisabled;
                temp[key].manifestUrl = app.manifestUrl;

                return temp;
            } else {
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
            }
        });

        setConnections((prev) => {
            if (prev[key]) {
                return {
                    ...prev,
                    [key]: [...prev[key], ...connections]
                }
            }
            return {
                ...prev,
                [key]: [...connections]
            }
        });
    });
}