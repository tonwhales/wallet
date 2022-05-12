import * as FileSystem from 'expo-file-system';
import { Engine } from "../Engine";
import { PersistedValueSync } from "../utils/PersistedValueSync";
import { sha256_sync } from 'ton-crypto';

export class DownloadAtom extends PersistedValueSync<string> {

    readonly link: string;

    constructor(link: string, engine: Engine) {
        super('download:' + link, engine.storage.download(link), engine);
        this.link = link;
        this.invalidate();
    }

    protected doSync = async (existing: string | null): Promise<string | null> => {
        if (existing) {
            return null;
        }
        console.log('Downloading: ' + this.link);
        let downloading = await FileSystem.downloadAsync(
            this.link,
            FileSystem.documentDirectory + sha256_sync(this.link).toString('hex'),
            {}
        );
        console.log('Downloaded to ' + downloading.uri);
        return downloading.uri;
    }
}