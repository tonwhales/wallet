import { ReactSync } from "../react/ReactSync";
import { PersistedValueSync } from "./PersistedValueSync";

export class SyncCollection<T> {
    #items = new Map<string, PersistedValueSync<T>>();
    #value = new ReactSync<{ [key: string]: T }>();
    #unsubscribes = new Map<string, () => void>();

    constructor() {
        this.#value.value = {};
    }

    get(key: string) {
        return this.#items.get(key);
    }

    getAll() {
        return Array.from(this.#items.keys());
    }

    has(key: string) {
        return this.#items.has(key);
    }

    add(key: string, sync: PersistedValueSync<T>) {
        if (!this.#items.has(key)) {
            this.#items.set(key, sync);
            let handler = (d: T) => {
                this.#value.value = { ...this.#value.value, [key]: d };
            }
            sync.ref.on('ready', handler);
            sync.ref.on('updated', handler);
            let unsubscribe = () => {
                sync.ref.off('ready', handler);
                sync.ref.off('updated', handler);
            };
            this.#unsubscribes.set(key, unsubscribe);
            let v = sync.current;
            if (v) {
                this.#value.value = { ...this.#value.value, [key]: v };
            }
        }
    }

    remove(key: string) {
        if (this.#items.delete(key)) {

            // Update state
            let c = { ...this.#value.value };
            delete c[key];
            this.#value.value = c;

            // Unsubscribe
            let e = this.#unsubscribes.get(key);
            this.#unsubscribes.delete(key);
            if (e) {
                e();
            }
        }
    }

    use() {
        return this.#value.use();
    }

    get ready() {
        for (let v of this.#items.values()) {
            if (!v.ready) {
                return false;
            }
        }
        return true;
    }
}