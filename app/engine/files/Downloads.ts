import * as FileSystem from 'expo-file-system';
import { BoundedConcurrencyPool } from 'teslabot';
import { sha256_sync } from 'ton-crypto';
import { warn } from '../../utils/log';
import { backoff } from '../../utils/time';
import { Engine } from "../Engine";
import { useOptItem } from '../persistence/PersistedItem';

export class Downloads {
    readonly engine: Engine;
    readonly #downloadManager = new BoundedConcurrencyPool(16);
    readonly #requested = new Set<string>();

    constructor(engine: Engine) {
        this.engine = engine;
    }

    use(link: string) {
        let res = this.engine.model.download(link);
        if (link !== '') {
            if (!this.#requested.has(link)) {
                this.#requested.add(link);
                backoff('download:' + link, async () => {
                    this.#downloadManager.run(async () => {
                        await this.#download(link)
                    })
                });
            }
        }
        let path = useOptItem(res);
        if (path) {
            return FileSystem.cacheDirectory + path;
        } else {
            return null;
        }
    }

    #download = async (link: string) => {

        // Link key
        let item = this.engine.model.download(link);
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
            console.log('Re-Downloading: ' + link);
        }

        // Downloading
        console.log('Downloading: ' + link);
        let downloading = await FileSystem.downloadAsync(link, FileSystem.cacheDirectory + key, {});
        console.log('Downloaded to ' + downloading.uri);

        // Persist
        item.update(() => key);
    }
}