import { selectorFamily, useRecoilValue } from "recoil";
import { AppData, fetchAppData } from "../api/fetchAppData";
import { Engine } from "../Engine";
import * as FileSystem from 'expo-file-system';
import { sha256_sync } from "ton-crypto";
import { warn } from "../../utils/log";
import { resolveLink } from "../../utils/resolveLink";
import * as t from 'io-ts';

export type TrustedApp = {
    url: string,
}

export const trustedAppCodec = t.type({
    url: t.string,
});

export class AppsProduct {
    readonly engine: Engine;
    readonly appDataSelector;
    readonly appSessionSelector;

    constructor(engine: Engine) {
        this.engine = engine;

        this.appDataSelector = selectorFamily<AppData | null, string>({
            key: 'dApps',
            get: (url) => ({ get }) => {
                const atom = this.engine.persistence.dApps.item(url).atom;
                const data = get(atom);
                return data;
            }
        });
        this.appSessionSelector = selectorFamily<TrustedApp | undefined, string>({
            key: 'dAppsList',
            get: (url) => ({ get }) => {
                const atom = this.engine.persistence.dAppsList.item().atom;
                const data = get(atom)?.apps;
                const session = data?.find((i) => i.url === url);
                return session;
            }
        });
    }

    useAppsList() {
        return useRecoilValue(this.engine.persistence.dAppsList.item().atom)?.apps;
    }

    useAppSession(url: string) {
        return useRecoilValue(this.appSessionSelector(url));
    }

    useAppData(url: string) {
        return useRecoilValue(this.appDataSelector(url));
    }

    async getAppData(url: string) {
        const persisted = this.engine.persistence.dApps.item(url).value;
        // fetch and add if does not exist
        if (!persisted) {
            try {
                const appData = await fetchAppData(url);
                if (appData) {
                    await this.updateAppData(url, appData);
                    return appData;
                }
            } catch (e) {
                warn(e);
                return null;
            }
            return null;
        }
        return persisted;
    }

    private async updateAppData(url: string, appData: AppData) {
        const app = this.engine.persistence.dApps.item(url);

        // Resolve app icon image
        // const imageLink = appData.image?.preview256;
        // if (imageLink) {
        //     let item = this.engine.persistence.downloads.item(imageLink);
        //     let key = sha256_sync(imageLink).toString('hex');

        //     try {
        //         let info = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + key);
        //         // Check if file exists
        //         if (!info.exists) {
        //             let url = resolveLink(imageLink || '');
        //             if (url) {
        //                 (async () => {
        //                     await FileSystem.downloadAsync(url, FileSystem.cacheDirectory + key, {});
        //                     item.update(() => key);
        //                 })();
        //             }
        //         }
        //     } catch (e) {
        //         warn(e);
        //     }
        // }

        app.update(() => appData);
    }

    addAppToList(app: TrustedApp) {
        const item = this.engine.persistence.dAppsList.item();
        const apps = item.value?.apps || [];
        const index = apps.findIndex((s) => s.url === app.url);
        if (index !== -1) {
            apps[index] = app
            item.update(() => { return { apps } });
            return app;
        }
        apps.push(app);
        item.update(() => { return { apps } });
        return app;
    }

    removeApp(url: string) {
        const item = this.engine.persistence.dAppsList.item();
        const apps = item.value?.apps || [];
        const index = apps.findIndex((s) => s.url === url);
        if (index !== -1) {
            apps.splice(index, 1);
        }
        item.update(() => { return { apps } });
    }
}