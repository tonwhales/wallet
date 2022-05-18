import { log } from "../../utils/log";
import { Engine } from "../Engine";
import { ReactSync } from "./ReactSync";
import { InvalidateSync } from "./InvalidateSync";
import { PersistedValue } from "./PersistedValue";
import { createEngineSync } from "./createEngineSync";

export abstract class PersistedValueSync<T> {
    readonly engine: Engine;
    readonly ref: ReactSync<T> = new ReactSync();

    #item: PersistedValue<T>;
    #sync: InvalidateSync;
    #last: T | null;

    constructor(key: string, item: PersistedValue<T>, engine: Engine) {
        this.engine = engine;
        this.#item = item;
        this.#last = item.current;
        if (this.#last) {
            this.ref.value = this.#last;
        }
        this.#sync = createEngineSync(key, engine, async () => {
            // Do sync
            let processed = await this.doSync(this.#last);

            // Process
            if (processed) {
                this.updateValue(processed);
            }
        });
    }

    protected updateValue(src: T) {
        // Apply local
        this.#last = src;
        this.#item.update(src);

        // Notify
        this.ref.value = src;
    }

    protected doSync = async (src: T | null): Promise<T | null> => {
        return null;
    }

    invalidate() {
        this.#sync.invalidate();
    }

    use() {
        return this.ref.use();
    }

    get ready() {
        return this.ref.ready;
    }

    get current() {
        return this.#last;
    }
}