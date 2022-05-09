import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { AccountWatcher } from "../blocks/AccountWatcher";
import { Engine } from "../Engine";
import { PersistedValueSync } from "../utils/PersistedValueSync";

export type LiteAccount = {
    balance: BN;
    last: { lt: BN, hash: string } | null;
    block: number;
}

export class AccountLiteSync extends PersistedValueSync<LiteAccount> {

    readonly address: Address;

    #watcher: AccountWatcher;

    constructor(address: Address, engine: Engine) {
        super(`account-lite(${address.toFriendly({ testOnly: AppConfig.isTestnet })})`, engine.persistence.liteAccounts.item(address), engine);
        this.address = address;
        this.#watcher = engine.accounts.getWatcherForAddress(address);
        this.#watcher.on('account_changed', (account) => {
            this.updateValue({
                balance: account.state.balance,
                last: account.state.last ? { lt: new BN(account.state.last.lt, 10), hash: account.state.last.hash } : null,
                block: account.state.seqno
            });
        });
    }
}