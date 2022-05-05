import { AsyncLock } from "teslabot";

export class MapAsyncLock {

    #locks = new Map<string, AsyncLock>();

    inLock<T>(key: string, func: () => Promise<T>) {
        let e = this.#locks.get(key);
        if (!e) {
            e = new AsyncLock();
            this.#locks.set(key, e);
        }
        return e.inLock(func);
    }
}