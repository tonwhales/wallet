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
                console.log('[selector get]', url);
                const atom = this.engine.persistence.deApps.item(url).atom;
                const data = get(atom);
                console.log('[selector get]', url, atom.key, data);
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
        if (!persisted) {
            try {
                const appData = await fetchAppData(url);
                if (appData) {
                    await this.addApp(url, appData);
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

    async addApp(url: string, appData: AppData) {
        const app = this.engine.persistence.deApps.item(url);

        // Resolve app icon image
        const link = appData.image?.preview256;
        if (link) {
            let item = this.engine.persistence.downloads.item(link);
            let key = sha256_sync(link).toString('hex');

            try {
                let info = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + key);
                // Check if file exist
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

    removeApp(url: string) {
        const apps = this.engine.persistence.deAppsList.getValue() || [];
        const index = apps.findIndex((s) => s === url);
        if (index !== -1) {
            apps.splice(index, 1);
            this.engine.persistence.deAppsList.item().update(() => apps);
        }
    }
}