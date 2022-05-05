import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { ReactSync } from "../react/ReactSync";
import { Sync } from "./utils/Sync";

export class RelatedAccountsSync<T> {
    readonly engine: Engine;
    readonly #addresses = new Map<string, Sync<Address, T>>();
    readonly #sync: (address: Address) => Sync<Address, T>;
    readonly #state: ReactSync<{ [address: string]: T }>;

    constructor(engine: Engine, sync: (address: Address) => Sync<Address, T>) {
        this.engine = engine;
        this.#sync = sync;
        this.#state = new ReactSync();
        this.#state.value = {};
    }

    useState() {
        return this.#state.use();
    }

    setAddresses(addresses: Address[]) {
        for (let a of addresses) {
            let k = a.toFriendly({ testOnly: AppConfig.isTestnet });
            if (!this.#addresses.has(k)) {
                let s = this.#sync(a);
                this.#addresses.set(k, s);
                if (s.ready) {
                    this.#state.value = { ...this.#state.value, [k]: s.state };
                }
                s.on('ready', (data) => {
                    this.#state.value = { ...this.#state.value, [k]: data.state };
                });
                s.on('updated', (data) => {
                    this.#state.value = { ...this.#state.value, [k]: data.state };
                });
            }
        }
    }
}