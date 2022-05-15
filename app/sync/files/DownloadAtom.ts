import * as FileSystem from 'expo-file-system';
import { Engine } from "../Engine";
import { PersistedValueSync } from "../utils/PersistedValueSync";
import { sha256_sync } from 'ton-crypto';
import { warn } from '../../utils/log';

export class DownloadAtom extends PersistedValueSync<string> {

    readonly link: string;

    constructor(link: string, engine: Engine) {
        super('download:' + link, engine.storage.download(link), engine);
        this.link = link;
        this.invalidate();
    }

    protected doSync = async (existing: string | null): Promise<string | null> => {

        // Link key
        let key = sha256_sync(this.link).toString('hex');

        // Check if file exist
        if (existing) {
            try {
                let info = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + existing);
                if (info.exists) {
                    return null;
                }
            } catch (e) {
                warn(e);
            }
            console.log('Re-Downloading: ' + this.link);
        }

        // Downloading
        console.log('Downloading: ' + this.link);
        let downloading = await FileSystem.downloadAsync(
            this.link,
            FileSystem.cacheDirectory + key,
            {}
        );
        console.log('Downloaded to ' + downloading.uri);
        return key;
    }
}