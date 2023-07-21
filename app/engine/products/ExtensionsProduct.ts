import { RecoilValueReadOnly, selector, useRecoilValue } from "recoil";
import { AppData, fetchAppData } from "../api/fetchAppData";
import { Engine } from "../Engine";
import { warn } from "../../utils/log";
import { CloudValue } from "../cloud/CloudValue";
import { AppState } from "react-native";
import { sha256_sync } from "ton-crypto";
import { toUrlSafe } from "../../utils/toUrlSafe";
import { fetchExtensionStats } from "../api/reviews";

export type Extension = {
    key: string;
    url: string;
    name: string;
    date: number;
    image: {
        blurhash: string;
        url: string;
    } | null;
    description: string | null;
}



export type DomainSubkey = {
    time: number,
    signature: Buffer,
    secret: Buffer
}

export function extensionKey(src: string) {
    return toUrlSafe(sha256_sync(src.toLocaleLowerCase().trim()).toString('base64'));
}

export class ExtensionsProduct {
    readonly engine: Engine;
    readonly extensions: CloudValue<{ installed: { [key: string]: { url: string, date: number, title?: string | null, image?: { url: string, blurhash: string } | null } } }>;
    readonly #extensionsSelector: RecoilValueReadOnly<Extension[]>;

    constructor(engine: Engine) {
        this.engine = engine;
        this.extensions = this.engine.cloud.get('wallet.extensions.v2', (src) => { src.installed = {} });
        this.#extensionsSelector = selector({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: this.engine.isTestnet }) + '/extensions',
            get: ({ get }) => {
                let apps = get(this.extensions.atom);
                let res: {
                    key: string,
                    url: string,
                    name: string,
                    date: number,
                    image: { blurhash: string, url: string } | null,
                    description: string | null
                }[] = [];
                for (let k in apps.installed) {
                    let ap = apps.installed[k];
                    let data = get(this.engine.persistence.dApps.item(ap.url).atom);
                    if (!data) {
                        continue;
                    }
                    res.push({
                        key: k,
                        url: ap.url,
                        name: ap.title ? ap.title : data.title,
                        date: ap.date,
                        description: data.description,
                        image: ap.image
                            ? ap.image
                            : (data.image ? { url: data.image.preview256, blurhash: data.image.blurhash } : null)
                    });
                }
                return res;
            }
        });

        // Refresh on app load
        AppState.addEventListener('change', () => {
            this.extensions.invalidate();
        });
    }

    useExtensions() {
        return useRecoilValue(this.#extensionsSelector);
    }

    addExtension(url: string, title: string | null, image: { url: string, blurhash: string } | null) {
        let key = extensionKey(url);
        if (this.extensions.value.installed[key]) {
            return;
        }
        this.extensions.update((doc) => {
            doc.installed[key] = {
                url,
                title: title ? title : null,
                image: image ? image : null,
                date: Math.floor((Date.now() / 1000))
            }
        });
    }

    removeExtension(key: string) {
        if (!this.extensions.value.installed[key]) {
            return;
        }
        this.extensions.update((doc) => {
            delete doc.installed[key];
        });
    }

    useAppData(url: string) {
        return useRecoilValue(this.engine.persistence.dApps.item(url).atom);
    }

    
    async requestExtensionStatsUpdate(url: string) {
        const item = this.engine.persistence.dAppsStats.item(url);
        const fetched = await fetchExtensionStats(url);
        item.update(() => fetched);
    }
    
    useExtensionStats(url: string) {
        this.requestExtensionStatsUpdate(url);
        return useRecoilValue(this.engine.persistence.dAppsStats.item(url).atom);
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