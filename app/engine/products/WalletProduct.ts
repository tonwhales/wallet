import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { Transaction } from "../Transaction";
import { atom, RecoilState, RecoilValue, useRecoilValue } from "recoil";
import { useOptItem } from "../persistence/PersistedItem";

export type WalletState = {
    balance: BN;
    seqno: number;
    transactions: string[];
    pending: Transaction[]
}

export class WalletProduct {

    readonly engine: Engine;
    readonly address: Address;

    // State
    #state: WalletState | null = null;
    #atom: RecoilState<WalletState | null>;

    constructor(engine: Engine) {
        this.engine = engine;
        this.address = engine.address;
        this.#atom = atom<WalletState | null>({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }),
            default: null
        });

        engine.persistence.wallets.item(engine.address).for((state) => {

            // Resolve pending
            let pending: Transaction[] = [];
            if (this.#state) {
                pending = this.#state.pending.filter((t) => t.seqno! > state.seqno)
            }

            // Resolve updated state
            this.#state = {
                ...state,
                pending
            };

            // Notify
            engine.recoil.updater(this.#atom, this.#state);
        })
    }

    loadMore = (lt: string, hash: string) => {
        // this.parent.parent.loadMore({ lt, hash });
    }

    registerPending(src: Transaction) {
        if (!this.#state) {
            return;
        }
        if (src.seqno === null) {
            return;
        }
        if (src.seqno < this.#state.seqno) {
            return;
        }
        if (src.status !== 'pending') {
            return;
        }

        // Update
        this.#state = { ...this.#state, pending: [src, ...this.#state.pending] };

        // Notify
        this.engine.recoil.updater(this.#atom, this.#state);
    }

    useAccount() {
        return useRecoilValue(this.#atom);
    }

    // usePlugins() {
    //     return this.#plugins.use();
    // }

    // useJettons() {
    //     return this.#jettons.useState();
    // }
}