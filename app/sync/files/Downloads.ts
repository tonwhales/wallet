import * as FileSystem from 'expo-file-system';
import { Engine } from "../Engine";

export class Downloads {
    readonly engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    use(link: string) {
        let res = this.engine.storage.download(link);
        if (link !== '') {
            this.engine.accounts.getDownload(link);
        }
        let path = res.use();
        if (path) {
            return FileSystem.cacheDirectory + path;
        } else {
            return null;
        }
    }
}