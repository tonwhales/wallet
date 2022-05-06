import { Engine } from "../Engine";
import { PersistedItem } from "../PersistedCollection";
import { ReactSync } from "../react/ReactSync";
import { InvalidateSync } from "./InvalidateSync";

export abstract class PersistedValueSync<T> {
    readonly engine: Engine;
    readonly ref: ReactSync<T> = new ReactSync();

    #item: PersistedItem<T>;
    #sync: InvalidateSync;
    #lock: (() => void) | null = null;
    #last: T | null;

    constructor(item: PersistedItem<T>, engine: Engine) {
        this.engine = engine;
        this.#item = item;
        this.#last = item.getValue();
        if (this.#last) {
            this.ref.value = this.#last;
        }
        this.#sync = new InvalidateSync(async () => {

            // Do sync
            let processed = await this.doSync(this.#last);

            // Process
            if (processed) {
                this.updateValue(processed);
            }
        });
        this.#sync.on('invalidated', () => {
            if (!this.#lock) {
                this.#lock = engine.state.beginUpdating();
            }
        });
        this.#sync.on('ready', () => {
            if (this.#lock) {
                this.#lock();
                this.#lock = null;
            }
        });
    }

    protected updateValue(src: T) {
        // Apply local
        this.#last = src;
        this.#item.setValue(src);

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