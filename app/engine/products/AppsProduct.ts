import { selectorFamily, useRecoilValue } from "recoil";
import { AppData, fetchAppData } from "../api/fetchAppData";
import { Engine } from "../Engine";
import { warn } from "../../utils/log";

export type DomainSubkey = {
    time: number,
    signature: Buffer,
    secret: Buffer
}

export class AppsProduct {
    readonly engine: Engine;
    readonly appDataSelector;

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
        app.update(() => appData);
    }
}