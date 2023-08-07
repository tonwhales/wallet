import axios from 'axios';
import * as t from 'io-ts';

export const holdersOfflineAppCodec = t.type({
    version: t.string,
    routes: t.array(t.type({
        fileName: t.string,
        path: t.string,
        source: t.string
    })),
    resources: t.array(t.string)
});

export type HoldersOfflineResMap = t.TypeOf<typeof holdersOfflineAppCodec>;

export async function fetchHoldersResourceMap(endpoint: string) {
    const holdersAppFile = (await axios.get(`${endpoint}/app-cache/info.json`)).data;

    if (holdersOfflineAppCodec.is(holdersAppFile)) {
        return holdersAppFile as HoldersOfflineResMap;
    }

    return null;
}
