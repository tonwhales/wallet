import { log } from "../../utils/log";
import { Engine } from "../Engine";
import { InvalidateSync } from "./InvalidateSync";

export function createEngineSync(key: string, engine: Engine, handler: () => Promise<void>) {
    let lock: (() => void) | null = null;
    let invalidateTime: number | null = null;
    let sync = new InvalidateSync(key, handler);
    sync.on('invalidated', () => {
        if (!lock) {
            invalidateTime = Date.now();
            log(`${key}: invalidated`);
            lock = engine.state.beginUpdating();
        }
    });
    sync.on('ready', () => {
        if (lock) {
            log(`${key}: ready in ${Date.now() - invalidateTime!} ms`);
            lock();
            lock = null;
        }
    });
    log(`${key}: created`);
    return sync;
}