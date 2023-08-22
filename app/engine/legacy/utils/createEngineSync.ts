import { createLogger, log } from "../../../utils/log";
import { Engine } from "../Engine";
import { InvalidateSync } from "./InvalidateSync";

export function createEngineSync(key: string, engine: Engine, handler: () => Promise<void>) {
    let logger = createLogger('sync');
    let lock: (() => void) | null = null;
    let invalidateTime: number | null = null;
    let sync = new InvalidateSync(key, handler);
    sync.on('invalidated', () => {
        if (!lock) {
            invalidateTime = Date.now();
            logger.log(`${key}: invalidated`);
            lock = engine.state.beginUpdating();
        }
    });
    sync.on('ready', () => {
        if (lock) {
            logger.log(`${key}: ready in ${Date.now() - invalidateTime!} ms`);
            lock();
            lock = null;
        }
    });
    logger.log(`${key}: created`);
    return sync;
}