import { Engine } from "../Engine";
import { ReactSync } from "../utils/ReactSync";
import { InvalidateSync } from "../utils/InvalidateSync";
import { PersistedItem } from "./PersistedItem";
import { createEngineSync } from "../utils/createEngineSync";

export abstract class PersistedValueSync<T> {
    readonly engine: Engine;
    readonly ref: ReactSync<T> = new ReactSync();

    #item: PersistedItem<T>;
    #sync: InvalidateSync;

    constructor(key: string, item: PersistedItem<T>, engine: Engine) {
        this.engine = engine;
        this.#item = item;
        if (this.#item.value) {
            this.ref.value = this.#item.value;
        }
        this.#sync = createEngineSync(key, engine, async () => {
            // Do sync
            let processed = await this.doSync(this.#item.value);

            // Process
            if (processed) {
                this.updateValue(processed);
            }
        });
    }

    protected updateValue(src: T) {
        // Apply local
        this.#item.update(() => src);

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
        return this.#item.value;
    }
}