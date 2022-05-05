import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { WalletPersisted } from "../Persistence";
import { ReactSync } from "../react/ReactSync";
import { Transaction } from "../Transaction";
import { FullAccount } from "./AccountFullSync";
import { JettonWalletState, JettonWalletSync } from "./JettonWalletSync";
import { PluginState, PluginSync } from "./PluginSync";
import { RelatedAccountsSync } from "./RelatedAccountsSync";
import { TokenSync } from "./TokenSync";
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
    #tokens: TokenSync;
    #jettons: RelatedAccountsSync<JettonWalletState>;

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

        // Tokens
        this.#tokens = new TokenSync(engine, address);

        // Jettons
        this.#jettons = new RelatedAccountsSync(engine, (addr) => new JettonWalletSync(engine, addr));
        this.#jettons.setAddresses(this.#tokens.getWallets());
        this.#tokens.on('ready', () => {
            this.#jettons.setAddresses(this.#tokens.getWallets());
        });
        this.#tokens.on('updated', () => {
            this.#jettons.setAddresses(this.#tokens.getWallets());
        });

        // if (AppConfig.isTestnet) {
        //     this.#jettons.setAddresses([Address.parse('kQDBKeGhu9nkQ6jDqkBM9PKxBhGPLEK9Zzj-R2eP8jXK-8Pk')]);
        // } else {
        //     this.#jettons.setAddresses([Address.parse('EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj')]);
        // }

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

    useJettons() {
        let res = this.#jettons.useState();
        let jettons: { name: string, description: string, symbol: string, address: Address, master: Address, balance: BN }[] = [];
        for (let r in res) {
            let jt = res[r];
            if (jt.balance.lte(new BN(0))) {
                continue;
            }
            if (!jt.content || !jt.content.name || !jt.content.symbol || !jt.content.description || !jt.master) {
                continue;
            }
            jettons.push({
                name: jt.content.name,
                symbol: jt.content.symbol,
                address: Address.parse(r),
                master: jt.master,
                balance: jt.balance,
                description: jt.content.description
            });
        }
        return jettons;
    }

    get ready() {
        return this.#state.ready;
    }

    async awaitReady() {
        await this.#state.awaitReady();
    }
}