import BN from "bn.js";
import { Address } from "ton";
import { Engine } from "../Engine";
import { WalletPersisted } from "../Persistence";
import { ReactSync } from "../react/ReactSync";
import { Transaction } from "../Transaction";
import { FullAccount } from "./AccountFullSync";
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

    constructor(address: Address, engine: Engine) {

        // Handle sync
        this.#sync = createWalletDataSync(address, engine);
        this.#sync.on('account_ready', (src) => {
            this.#handleAccount(src.account, src.state);
        });
        this.#sync.on('account_updated', (src) => {
            this.#handleAccount(src.account, src.state);
        });

        // Handle initial
        if (this.#sync.ready) {
            this.#state.value = {
                balance: new BN(this.#sync.state.balance, 10),
                seqno: this.#sync.state.seqno,
                transactions: this.#sync.state.transactions,
                pending: []
            };
        }
    }

    #handleAccount = (account: FullAccount, persisted: WalletPersisted) => {
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

    get ready() {
        return this.#state.ready;
    }

    async awaitReady() {
        await this.#state.awaitReady();
    }
}