import { queryClient } from "../../clients";
import { useTonConnectExtensions } from "../../hooks/dapps/useTonConnectExtenstions";
import { ConnectedAppConnection } from "../../legacy/tonconnect/types";
import { Queries } from "../../queries";
import { extensionKey } from "./useAddExtension";

export function useSaveAppConnection({
    app,
    connection
}: {
    app: { url: string, name: string, iconUrl: string, autoConnectDisabled: boolean },
    connection: ConnectedAppConnection
}) {

    const [extensions, update] = useTonConnectExtensions();
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

    queryClient.setQueryData<ConnectedAppConnection[]>(Queries.TonConnect().Connections(), (src) => {
        return [...(src ?? []), connection];
    });
}