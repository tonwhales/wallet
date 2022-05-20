import BN from "bn.js";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { Transaction } from "../Transaction";
import { atom, atomFamily, RecoilState, RecoilValueReadOnly, selector, useRecoilValue, selectorFamily } from "recoil";
import * as FileSystem from 'expo-file-system';
import { ContractMetadata } from "../metadata/Metadata";
import { JettonMasterState } from "../sync/startJettonMasterSync";
import { createHistorySync } from "../sync/createHistorySync";
import { Operation } from "../transactions/types";
import { resolveOperation } from "../transactions/resolveOperation";

export type WalletState = {
    balance: BN;
    seqno: number;
    transactions: { id: string, time: number }[];
    next: { lt: string, hash: string } | null;
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

export type TransactionDescription = {
    base: Transaction;
    metadata: ContractMetadata | null;
    masterMetadata: JettonMasterState | null;
    operation: Operation;
    icon: string | null;
};

export class WalletProduct {

    readonly engine: Engine;
    readonly address: Address;

    // State
    #state: WalletState | null = null;
    #atom: RecoilState<WalletState | null>;
    #jettons: RecoilValueReadOnly<JettonsState>;
    #txs = new Map<string, Transaction>();
    #pending: Transaction[] = [];
    #txsAtom: (lt: string) => RecoilState<TransactionDescription>;
    #history: { loadMore(lt: string, hash: string): void };

    constructor(engine: Engine) {
        this.engine = engine;
        this.address = engine.address;
        this.#atom = atom<WalletState | null>({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }),
            default: null,
            dangerouslyAllowMutability: true
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
            },
            dangerouslyAllowMutability: true
        });
        this.#txsAtom = atomFamily<TransactionDescription, string>({
            key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/txs',
            default: selectorFamily({
                key: 'wallet/' + engine.address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/txs/default',
                get: (id) => ({ get }) => {
                    let base = this.#txs.get(id);
                    if (!base) {
                        throw Error('Invalid transaction #' + id);
                    }

                    // Metadata
                    let metadata: ContractMetadata | null = null;
                    if (base.address) {
                        metadata = get(engine.persistence.metadata.item(base.address).atom);
                    }

                    // Jetton master
                    let masterMetadata: JettonMasterState | null = null;
                    if (metadata && metadata.jettonWallet) {
                        masterMetadata = get(engine.persistence.jettonMasters.item(metadata.jettonWallet.master).atom);
                    } else if (metadata && metadata.jettonMaster && base.address) {
                        masterMetadata = get(engine.persistence.jettonMasters.item(base.address).atom);
                    }

                    // Operation
                    let operation = resolveOperation({ body: base.body, amount: base.amount, account: base.address || engine.address, metadata, jettonMaster: masterMetadata });

                    // Icon
                    let icon: string | null = null;
                    if (operation.image) {
                        let downloaded = get(engine.persistence.downloads.item(operation.image).atom);
                        if (downloaded) {
                            icon = FileSystem.cacheDirectory + downloaded;
                        }
                    }

                    return {
                        base,
                        metadata,
                        masterMetadata,
                        operation,
                        icon
                    };
                },
                dangerouslyAllowMutability: true
            }),
            dangerouslyAllowMutability: true
        })

        engine.persistence.wallets.item(engine.address).for((state) => {

            // Update pending
            this.#pending = this.#pending.filter((v) => v.seqno && v.seqno > state.seqno);

            // Resolve hasMore flag
            let next: { lt: string, hash: string } | null = null;
            if (state.transactions.length > 0) {
                let tx = this.engine.transactions.getWalletTransaction(this.address, state.transactions[state.transactions.length - 1]);
                if (tx.prev) {
                    next = { lt: tx.prev.lt, hash: tx.prev.hash };
                }
            }

            // Resolve updated state
            this.#state = {
                balance: state.balance,
                seqno: state.seqno,
                transactions: [
                    ...this.#pending.map((v) => ({ id: v.id, time: v.time })),
                    ...state.transactions.map((v) => {
                        let tx = this.engine.transactions.getWalletTransaction(this.address, v);
                        return { id: tx.id, time: tx.time };
                    })
                ],
                next
            };

            // Update transactions
            for (let t of state.transactions) {
                if (!this.#txs.has(t)) {
                    let tx = this.engine.transactions.getWalletTransaction(this.address, t);
                    this.#txs.set(tx.id, tx);
                }
            }

            // Notify
            engine.recoil.updater(this.#atom, this.#state);
        });

        // History
        this.#history = createHistorySync(engine.address, engine);
    }

    loadMore = (lt: string, hash: string) => {
        this.#history.loadMore(lt, hash);
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
        this.#state = { ...this.#state, transactions: [{ id: src.id, time: src.time }, ...this.#state.transactions] };
        this.#pending.push(src);
        this.#txs.set(src.id, src);

        // Notify
        this.engine.recoil.updater(this.#atom, this.#state);
    }

    useAccount() {
        return useRecoilValue(this.#atom);
    }

    useJettons() {
        return useRecoilValue(this.#jettons).jettons;
    }

    useTransaction(id: string) {
        return useRecoilValue(this.#txsAtom(id));
    }
}