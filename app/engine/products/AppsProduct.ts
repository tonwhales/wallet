import { selectorFamily, useRecoilValue } from "recoil";
import { AppData } from "../api/fetchAppData";
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
            key: 'apps',
            get: (url) => ({ get }) => {
                const appData = get(this.engine.persistence.deApps.item(url).atom)
                return appData;
            }
        });
    }

    useAppData(url: string) {
        return useRecoilValue(this.selector(url));
    }

    async addApp(url: string, app: AppData) {
        const apps = this.engine.persistence.deAppsList.getValue() || [];
        const index = apps.findIndex((s) => s === url);

        if (index === -1) {
            apps.push(url);
            this.engine.persistence.deAppsList.setValue(undefined, apps);
        }

        const link = app.image?.preview256;
        // Resolve icon image
        if (link) {
            let item = this.engine.persistence.downloads.item(link);
            let key = sha256_sync(link).toString('hex');

            // Check if file exist
            if (item.value) {
                try {
                    let info = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + item.value);
                    if (info.exists) {
                        return;
                    }
                } catch (e) {
                    warn(e);
                }
            }
            let url = resolveLink(link || '');
            if (url) {
                let downloading = await FileSystem.downloadAsync(url, FileSystem.cacheDirectory + key, {});
                item.update(() => key);
            }
        }

        this.engine.persistence.deApps.setValue(url, app);
    }

    removeApp(url: string) {
        const apps = this.engine.persistence.deAppsList.getValue() || [];
        const index = apps.findIndex((s) => s === url);
        if (index !== -1) {
            apps.splice(index, 1);
            this.engine.persistence.deAppsList.setValue(undefined, apps);
        }
    }
}