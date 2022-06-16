import { selector, useRecoilValue } from "recoil";
import { AppData, fetchAppData } from "../api/fetchAppData";
import { Engine } from "../Engine";
import { warn } from "../../utils/log";
import { CloudValue } from "../cloud/CloudValue";
import { AppConfig } from "../../AppConfig";

export type DomainSubkey = {
    time: number,
    signature: Buffer,
    secret: Buffer
}

export class ExtensionsProduct {
    readonly engine: Engine;
    readonly extensions: CloudValue<{ [key: string]: { url: string, date: number } }>;
    readonly #extensionsSelector;

    constructor(engine: Engine) {
        this.engine = engine;
        this.extensions = this.engine.cloud.get('extensions', (src) => { });
        this.#extensionsSelector = selector({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/extensions',
            get: ({ get }) => {
                let apps = get(this.extensions.atom);
                let res: { url: string, name: string, date: number }[] = [];
                for (let k in apps) {
                    let ap = apps[k];
                    let data = this.engine.persistence.dApps.item(ap.url);
                    if (!data.value) {
                        continue;
                    }
                    res.push({ url: ap.url, name: data.value.title, date: ap.date });
                }
                return res;
            }
        });
    }

    useExtensions() {
        return useRecoilValue(this.#extensionsSelector);
    }

    addExtension(url: string) {
        let key = url.toLowerCase().trim();
        if (this.extensions.value[key]) {
            return;
        }
        this.extensions.update((doc) => {
            doc[key] = {
                url,
                date: Math.floor((Date.now() / 1000))
            }
        });
    }

    removeExtension(url: string) {
        let key = url.toLowerCase().trim();
        if (!this.extensions.value[key]) {
            return;
        }
        this.extensions.update((doc) => {
            delete doc[key];
        });
    }

    useAppData(url: string) {
        return useRecoilValue(this.engine.persistence.dApps.item(url).atom);
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
        app.update(() => appData);
    }
}