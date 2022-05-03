import { Address } from "ton";
import { Engine } from "../Engine";
import { AccountWatcher } from "../blocks/AccountWatcher";
import { BlocksWatcher } from "../blocks/BlocksWatcher";
import { AccountLiteSync } from "./AccountLiteSync";
import { AccountFullSync } from "./AccountFullSync";
import { WalletSync } from "./WalletSync";

export class Accounts {
    readonly engine: Engine;
    readonly blocksWatcher: BlocksWatcher;
    #watchers: Map<string, AccountWatcher> = new Map();
    #liteSync: Map<string, AccountLiteSync> = new Map();
    #fullSync: Map<string, AccountFullSync> = new Map();
    #walletSync: Map<string, WalletSync> = new Map();

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

    getFullSyncForAddress(address: Address) {
        let k = address.toFriendly();
        let ex = this.#fullSync.get(k);
        if (ex) {
            return ex;
        } else {
            let w = new AccountFullSync(address, this.engine);
            this.#fullSync.set(k, w);
            return w;
        }
    }

    getWalletSync(address: Address) {
        let k = address.toFriendly();
        let ex = this.#walletSync.get(k);
        if (ex) {
            return ex;
        } else {
            let w = new WalletSync(address, this.engine);
            this.#walletSync.set(k, w);
            return w;
        }
    }

    get ready() {
        for (let lt of this.#liteSync) {
            if (!lt[1].ready) {
                return false;
            }
        }
        for (let lt of this.#fullSync) {
            if (!lt[1].ready) {
                return false;
            }
        }
        return true;
    }

    async awaitReady() {
        for (let lt of this.#liteSync) {
            if (!lt[1].ready) {
                await lt[1].awaitReady();
            }
        }
        for (let lt of this.#fullSync) {
            if (!lt[1].ready) {
                await lt[1].awaitReady();
            }
        }
    }
}