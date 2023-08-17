import { BoundedConcurrencyPool } from "teslabot";
import { sha256_sync } from "ton-crypto";
import { backoff } from "../../utils/time";
import { Engine } from "../Engine";
import * as FileSystem from 'expo-file-system';
import { createLogger } from "../../utils/log";
import { resolveLink } from "../../utils/resolveLink";

let lock = new BoundedConcurrencyPool(16);
let logger = createLogger('download');

export function startFileSync(link: string, engine: Engine) {
    let item = engine.persistence.downloads.item(link);

    backoff('download:' + link, async () => {
        lock.run(async () => {

            // Link key
            let key = sha256_sync(link).toString('hex');

            // Check if file exist
            if (item.value) {
                try {
                    let info = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + item.value);
                    if (info.exists) {
                        return;
                    }
                } catch (e) {
                    logger.warn(e);
                }
                logger.log('Re-Downloading: ' + link);
            }

            // Downloading
            const resolved = resolveLink(link);
            if (resolved) {
                logger.log('Downloading: ' + resolved);
                let downloading = await FileSystem.downloadAsync(resolved, FileSystem.cacheDirectory + key, {});
                logger.log('Downloaded to ' + downloading.uri);

                // Persist
                item.update(() => key);
            }
        });
    });
}