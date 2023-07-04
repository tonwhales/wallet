import axios from 'axios';
import * as t from 'io-ts';

export const holdersAppCodecVersion = 1;

export const holdersOfflineAppCodec = t.type({
    version: t.string,
    routes: t.array(t.type({
        fileName: t.string,
        path: t.string,
        source: t.string
    })),
    resources: t.array(t.string)
});

export type HoldersOfflineApp = {
    version: string
    routes: {
        fileName: string
        path: string
        source: string
    }[]
    resources: string[]
}

export async function fetchHoldersResourceMap(endpoint: string) {
    const holdersAppFile = (await axios.get(`${endpoint}/app-cache/info.json`)).data;

    if (holdersOfflineAppCodec.is(holdersAppFile)) {
        return holdersAppFile as HoldersOfflineApp;
    }

    return null;
}
