import { atom, RecoilState, useRecoilState, useRecoilValue } from "recoil";
import { Engine } from "../Engine";
import { PersistedItem } from "../PersistedCollection";
import { AppStorage } from "../storage/AppStorage";
import { ReactSync } from "../utils/ReactSync";

export class PersistedValue<T> {
    readonly storage: AppStorage;
    readonly ref: ReactSync<T> = new ReactSync();

    #item: PersistedItem<T>;
    #state: RecoilState<T | null>;

    constructor(key: string, item: PersistedItem<T>, storage: AppStorage) {
        this.storage = storage;
        this.#item = item;
        let ex = item.getValue();
        if (ex) {
            this.ref.value = ex;
        }
        this.#state = atom({
            key,
            default: ex
        });
    };

    update(value: T) {
        this.#item.setValue(value);
        this.ref.value = value;
        this.storage.recoilUpdater(this.#state, value);
    }

    use() {
        return useRecoilValue(this.#state);
    }

    useRequired() {
        let res = useRecoilValue(this.#state);
        if (!res) {
            throw Error('No data');
        }
        return res;
    }

    get ready() {
        return this.ref.ready;
    }

    get current() {
        if (this.ref.ready) {
            return this.ref.value;
        } else {
            return null;
        }
    }
}