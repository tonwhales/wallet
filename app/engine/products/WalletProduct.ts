import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { Transaction } from "../Transaction";
import { atom, RecoilState, RecoilValueReadOnly, selector, useRecoilValue } from "recoil";
import * as FileSystem from 'expo-file-system';

export type WalletState = {
    balance: BN;
    seqno: number;
    transactions: string[];
    pending: Transaction[]
}

export type JettonsState = {
    jettons: {
        wallet: Address,
        master: Address,
        balance: BN,
        name: string,
        symbol: string,
        description: string,
        icon: string | null
    }[]
}

export class WalletProduct {

    readonly engine: Engine;
    readonly address: Address;

    // State
    #state: WalletState | null = null;
    #atom: RecoilState<WalletState | null>;
    #jettons: RecoilValueReadOnly<JettonsState>;

    constructor(engine: Engine) {
        this.engine = engine;
        this.address = engine.address;
        this.#atom = atom<WalletState | null>({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }),
            default: null
        });
        this.#jettons = selector({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/jettons',
            get: ({ get }) => {

                // Load known jettons
                let knownJettons = get(engine.persistence.knownAccountJettons.item(engine.address).atom) || [];

                // Load wallets
                let jettonWallets: { wallet: Address, master: Address, balance: BN }[] = [];
                for (let w of knownJettons) {
                    let jw = get(engine.persistence.jettonWallets.item(w).atom);
                    if (jw && jw.master) {
                        jettonWallets.push({ wallet: w, balance: jw.balance, master: jw.master });
                    }
                }

                // Load masters
                let jettonWalletsWithMasters: {
                    wallet: Address,
                    master: Address,
                    balance: BN,
                    name: string,
                    symbol: string,
                    description: string,
                    icon: string | null
                }[] = [];
                for (let w of jettonWallets) {
                    let jm = get(engine.persistence.jettonMasters.item(w.master).atom);
                    if (jm && jm.name && jm.symbol && jm.description) {

                        // Image path
                        let icon: string | null = null;
                        if (jm.image) {
                            let downloaded = get(engine.persistence.downloads.item(jm.image).atom);
                            if (downloaded) {
                                icon = FileSystem.cacheDirectory + downloaded;
                            }
                        }

                        jettonWalletsWithMasters.push({
                            ...w,
                            name: jm.name,
                            symbol: jm.symbol,
                            description: jm.description,
                            icon,
                        });
                    }
                }

                return { jettons: jettonWalletsWithMasters }
            }
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

    useJettons() {
        return useRecoilValue(this.#jettons).jettons;
    }
}