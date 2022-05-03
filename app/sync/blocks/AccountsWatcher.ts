import { Address } from "ton";
import { Engine } from "../Engine";
import { AccountWatcher } from "./AccountWatcher";
import { BlocksWatcher } from "./BlocksWatcher";

export class AccountsWatcher {
    readonly engine: Engine;
    readonly blocks: BlocksWatcher;
    #watchers: Map<string, AccountWatcher> = new Map();

    constructor(engine: Engine) {
        this.engine = engine;
        this.blocks = engine.blocks;
    }

    getWatcherForAddress(address: Address) {
        let k = address.toFriendly();
        let ex = this.#watchers.get(k);
        if (ex) {
            return ex;
        } else {
            let w = new AccountWatcher(address, this.engine);
            this.#watchers.set(k, w);
            return w;
        }
    }
}