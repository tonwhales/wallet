import BN from "bn.js";
import { Address } from "ton";
import { Engine } from "../Engine";
import { WalletPersisted } from "../Persistence";
import { ReactSync } from "../react/ReactSync";
import { Transaction } from "../Transaction";
import { FullAccount } from "./AccountFullSync";
import { PluginState, PluginSync } from "./PluginSync";
import { RelatedAccountsSync } from "./RelatedAccountsSync";
import { createWalletDataSync, WalletDataSync } from "./WalletDataSync";

export type WalletState = {
    balance: BN;
    seqno: number;
    transactions: string[];
    pending: Transaction[]
}

export class WalletSync {

    #sync: WalletDataSync;
    #state = new ReactSync<WalletState>();
    #plugins: RelatedAccountsSync<PluginState>;

    constructor(address: Address, engine: Engine) {

        // Handle sync
        this.#sync = createWalletDataSync(address, engine);
        this.#sync.on('account_ready', (src) => {
            this.#handleAccount(src.account, src.state);
        });
        this.#sync.on('account_updated', (src) => {
            this.#handleAccount(src.account, src.state);
        });

        // Plugins sync
        this.#plugins = new RelatedAccountsSync(engine, (addr) => new PluginSync(engine, addr));

        // Handle initial
        if (this.#sync.ready) {
            this.#state.value = {
                balance: new BN(this.#sync.state.balance, 10),
                seqno: this.#sync.state.seqno,
                transactions: this.#sync.state.transactions,
                pending: []
            };
            this.#plugins.setAddresses(this.#sync.state.plugins.map((v) => Address.parse(v)));
        }
    }

    #handleAccount = (account: FullAccount, persisted: WalletPersisted) => {

        // Account
        if (!this.#state.ready) {
            this.#state.value = {
                balance: new BN(account.balance, 10),
                seqno: persisted.seqno,
                transactions: account.transactions,
                pending: []
            };
        } else {
            this.#state.value = {
                balance: new BN(account.balance, 10),
                seqno: persisted.seqno,
                transactions: account.transactions,
                pending: this.#state.value.pending.filter((t) => t.seqno! > persisted.seqno)
            };
        }

        // Plugins
        this.#plugins.setAddresses(persisted.plugins.map((v) => Address.parse(v)));
    }

    registerPending(src: Transaction) {
        if (!this.#state.ready) {
            return;
        }
        if (src.seqno === null) {
            return;
        }
        if (src.seqno < this.#state.value.seqno) {
            return;
        }
        if (src.status !== 'pending') {
            return;
        }
        this.#state.value = { ...this.#state.value, pending: [src, ...this.#state.value.pending] };
    }

    useState() {
        return this.#state.use();
    }

    usePlugins() {
        return this.#plugins.useState();
    }

    get ready() {
        return this.#state.ready;
    }

    async awaitReady() {
        await this.#state.awaitReady();
    }
}