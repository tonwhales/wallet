import { selectorFamily, useRecoilValue } from "recoil";
import { AppData, fetchAppData } from "../api/fetchAppData";
import { Engine } from "../Engine";
import * as FileSystem from 'expo-file-system';
import { sha256_sync } from "ton-crypto";
import { warn } from "../../utils/log";
import { resolveLink } from "../../utils/resolveLink";

export class AppsProduct {
    readonly engine: Engine;
    readonly selector;

    constructor(engine: Engine) {
        this.engine = engine;

        this.selector = selectorFamily<AppData | null, string>({
            key: 'deApps',
            get: (url) => ({ get }) => {
                const atom = this.engine.persistence.deApps.item(url).atom;
                const data = get(atom);
                return data;
            }
        });
    }

    useAppsList() {
        return useRecoilValue(this.engine.persistence.deAppsList.item().atom);
    }

    useAppData(url: string) {
        return useRecoilValue(this.selector(url));
    }

    async getAppData(url: string) {
        const persisted = this.engine.persistence.deApps.item(url).value;
        // fetch and add if does not exist
        if (!persisted) {
            try {
                const appData = await fetchAppData(url);
                if (appData) {
                    await this.addAppData(url, appData);
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

    async addAppData(url: string, appData: AppData) {
        const app = this.engine.persistence.deApps.item(url);

        // Resolve app icon image
        const link = appData.image?.preview256;
        if (link) {
            let item = this.engine.persistence.downloads.item(link);
            let key = sha256_sync(link).toString('hex');

            try {
                let info = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + key);
                // Check if file exists
                if (!info.exists) {
                    let url = resolveLink(link || '');
                    if (url) {
                        let downloading = await FileSystem.downloadAsync(url, FileSystem.cacheDirectory + key, {});
                        item.update(() => key);
                    }
                }
            } catch (e) {
                warn(e);
            }
        }

        app.update(() => appData);
    }

    addAppToList(url: string) {
        const item = this.engine.persistence.deAppsList.item();
        const apps = item.value || [];
        const index = apps.findIndex((s) => s === url);
        if (index !== -1) {
            return;
        }
        apps.push(url);
        item.update(() => apps);
    }

    removeApp(url: string) {
        const item = this.engine.persistence.deAppsList.item();
        const apps = item.value || [];
        const index = apps.findIndex((s) => s === url);
        if (index !== -1) {
            apps.splice(index, 1);
            item.update(() => apps);
        }
    }
}