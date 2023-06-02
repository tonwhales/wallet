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

export type HoldersOfflineApp = {
    version: string
    routes: {
        fileName: string
        path: string
        source: string
    }[]
    resources: string[]
}

export async function fetchAppFile(endpoint: string) {
    const zenPayAppFile = (await axios.get(`${endpoint}/app-cache/app-info.json`)).data;

    if (holdersOfflineAppCodec.is(zenPayAppFile)) {
        return zenPayAppFile as HoldersOfflineApp;
    }

    throw Error('Invalid app file');
}
