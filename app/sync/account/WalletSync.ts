import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { JettonsSync } from "../jettons/JettonsSync";
import { ReactSync } from "../react/ReactSync";
import { Transaction } from "../Transaction";
import { SyncCollection } from "../utils/SyncCollection";
import { PluginState, PluginSync } from "./PluginSync";
import { WalletV4State, WalletV4Sync } from "./WalletV4Sync";

export type WalletState = {
    balance: BN;
    seqno: number;
    transactions: string[];
    pending: Transaction[]
}

export class WalletSync {

    readonly engine: Engine;
    readonly parent: WalletV4Sync;
    readonly address: Address;

    #state = new ReactSync<WalletState>();
    #plugins = new SyncCollection<PluginState>();
    #jettons: JettonsSync;

    get jettons() {
        return this.#jettons;
    }

    constructor(parent: WalletV4Sync) {
        this.engine = parent.engine;
        this.parent = parent;
        this.address = parent.address;
        this.#jettons = new JettonsSync(parent.parent);

        // Handle sync
        this.parent.ref.on('ready', (src) => {
            this.#handleAccount(src);
        });
        this.parent.ref.on('updated', (src) => {
            this.#handleAccount(src);
        });
        if (this.parent.ready) {
            this.#handleAccount(this.parent.current!);
        }
    }

    #handleAccount = (wallet: WalletV4State) => {

        // Account
        if (!this.#state.ready) {
            this.#state.value = {
                balance: wallet.balance,
                seqno: wallet.seqno,
                transactions: wallet.transactions,
                pending: []
            };
        } else {
            this.#state.value = {
                balance: wallet.balance,
                seqno: wallet.seqno,
                transactions: wallet.transactions,
                pending: this.#state.value.pending.filter((t) => t.seqno! > wallet.seqno)
            };
        }

        // Add plugins
        for (let p of wallet.plugins) {
            let k = p.toFriendly({ testOnly: AppConfig.isTestnet });
            if (!this.#plugins.has(k)) {
                this.#plugins.add(k, new PluginSync(this.engine.accounts.getLiteSyncForAddress(p)));
            }
        }

        // Remove plugins
        for (let p of this.#plugins.getAll()) {
            if (!wallet.plugins.find((v) => v.toFriendly({ testOnly: AppConfig.isTestnet }) === p)) {
                this.#plugins.remove(p);
            }
        }
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
        return this.#plugins.use();
    }

    useJettons() {
        return this.#jettons.useState();
    }

    get ready() {
        return this.#state.ready;
    }

    async awaitReady() {
        await this.#state.awaitReady();
    }
}