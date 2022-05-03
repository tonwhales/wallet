import { Address } from "ton";
import { Engine } from "../Engine";
import { AccountWatcher } from "../blocks/AccountWatcher";
import { BlocksWatcher } from "../blocks/BlocksWatcher";
import { AccountLiteSync } from "./AccountLiteSync";

export class Accounts {
    readonly engine: Engine;
    readonly blocksWatcher: BlocksWatcher;
    #watchers: Map<string, AccountWatcher> = new Map();
    #liteSync: Map<string, AccountLiteSync> = new Map();

    constructor(engine: Engine) {
        this.engine = engine;
        this.blocksWatcher = engine.blocksWatcher;
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

    getLiteSyncForAddress(address: Address) {
        let k = address.toFriendly();
        let ex = this.#liteSync.get(k);
        if (ex) {
            return ex;
        } else {
            let w = new AccountLiteSync(address, this.engine);
            this.#liteSync.set(k, w);
            return w;
        }
    }
}