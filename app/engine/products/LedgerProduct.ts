import { Engine } from "../Engine";
import Transport from "@ledgerhq/hw-transport";
import { Address } from "ton";
import { atom, atomFamily, RecoilState, RecoilValueReadOnly, selectorFamily, useRecoilValue } from "recoil";
import { startAddressHintsSync } from "../sync/startAddressHintsSync";
import { AppConfig } from "../../AppConfig";
import { startHintSync } from "../sync/startHintSync";
import { JettonsState, TransactionDescription, WalletState } from "./WalletProduct";
import BN from "bn.js";
import * as FileSystem from 'expo-file-system';
import { t } from "../../i18n/t";
import { Transaction } from "../Transaction";
import { createHistorySync } from "../sync/createHistorySync";
import { ContractMetadata } from "../metadata/Metadata";
import { JettonMasterState } from "../sync/startJettonMasterSync";
import { resolveOperation } from "../transactions/resolveOperation";
import { KnownJettonMasters } from "../../secure/KnownWallets";
import { startHintsTxSync } from "../sync/startHintsTxSync";

export type TypedTransport = { type: 'hid' | 'ble', transport: Transport }
export type LedgerAddress = { acc: number, address: string, publicKey: Buffer };

export class LedgerProduct {
    readonly engine: Engine;
    #hintsStarted = new Set<string>();
    #jettonsSelector;
    #state: WalletState | null = null;
    #atom: RecoilState<WalletState | null> | null = null;
    #txs = new Map<string, Transaction>();
    #txsAtom: ((lt: string) => RecoilState<TransactionDescription>) | null = null;
    #history: { loadMore(lt: string, hash: string): void } | null = null;
    #initialLoad: boolean = true;

    constructor(engine: Engine) {
        this.engine = engine;
        this.#jettonsSelector = selectorFamily<JettonsState, string>({
            key: 'ledger/jettons',
            get: (address) => ({ get }) => {
                const owner = Address.parse(address);
                // Load known jettons
                let knownJettons = get(engine.persistence.knownAccountJettons.item(owner).atom) || [];

                // Load disabled jeetons
                let disabledJettons = get(engine.persistence.disabledJettons.item(owner).atom) || [];

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
                    icon: string | null,
                    decimals: number | null,
                    disabled?: boolean
                }[] = [];
                for (let w of jettonWallets) {
                    let jm = get(engine.persistence.jettonMasters.item(w.master).atom);

                    if (jm && !jm.description) {
                        jm.description = `$${jm.symbol} ${t('jetton.token')}`;
                    }

                    if (jm && jm.name && jm.symbol && jm.description) {

                        // Image path
                        let icon: string | null = null;
                        if (jm.image) {
                            let downloaded;
                            if (typeof jm.image === 'string') {
                                downloaded = get(engine.persistence.downloads.item(jm.image).atom);
                            } else {
                                downloaded = get(engine.persistence.downloads.item(jm.image.preview256).atom);
                            }
                            if (downloaded) {
                                icon = FileSystem.cacheDirectory + downloaded;
                            }
                        }

                        const disabled = !!disabledJettons.find((m) => m.equals(w.master));

                        jettonWalletsWithMasters.push({
                            ...w,
                            name: jm.name,
                            symbol: jm.symbol,
                            description: jm.description,
                            icon,
                            decimals: jm.decimals,
                            disabled
                        });
                    }
                }

                return { jettons: jettonWalletsWithMasters }
            },
            dangerouslyAllowMutability: true
        });
    }

    useWallet(address?: Address) {
        if (!address) {
            return null;
        }
        return useRecoilValue(this.engine.persistence.wallets.item(address).atom);
    }

    useAccount() {
        if (!this.#atom) {
            return null;
        }
        return useRecoilValue(this.#atom);
    }

    useJettons(address?: Address) {
        if (!address) {
            return null;
        }
        return useRecoilValue(this.#jettonsSelector(address.toFriendly({ testOnly: AppConfig.isTestnet })));
    }

    useTransaction(id: string) {
        if (!this.#txsAtom) {
            return null;
        }
        return useRecoilValue(this.#txsAtom(id));
    }

    startSync(address: Address) {
        console.log(`Starting sync for ${address.toFriendly({ testOnly: AppConfig.isTestnet })}...`);
        this.startHintsSync(address);
        this.#atom = atom<WalletState | null>({
            key: 'wallet/' + address.toFriendly({ testOnly: AppConfig.isTestnet }),
            default: null,
            dangerouslyAllowMutability: true
        });

        // Loading transactions
        this.engine.persistence.wallets.item(address).for((state) => {
            // Resolve hasMore flag
            let next: { lt: string, hash: string } | null = null;

            const transactions: Transaction[] = [];

            // Latest transaction
            const last = this.engine.persistence.fullAccounts.item(address).value?.last;

            if (last) {
                let latest = this.engine.transactions.get(address, last.lt.toString(10));

                if (!latest) {
                    return;
                }

                // Push latest
                transactions.push(latest);

                // Set next
                if (latest.prev) {
                    next = { lt: latest.prev.lt, hash: latest.prev.hash };
                }

                let toLoad = this.#initialLoad ? 20 : state.transactions.length;

                if (state.transactions.length <= 20) {
                    toLoad = state.transactions.length - 1; // first 10 txs except for the latest
                }

                for (let i = 0; i < toLoad - 1; i++) {

                    if (!next) {
                        break;
                    }

                    let tx = this.engine.transactions.get(address, next.lt);

                    if (!tx) {
                        break;
                    }

                    transactions.push(tx);

                    if (tx.prev) {
                        next = { lt: tx.prev.lt, hash: tx.prev.hash };
                    }
                }
            }

            // Set initial tag
            if (this.#initialLoad) {
                this.#initialLoad = false;
            }

            // Resolve updated state
            this.#state = {
                balance: state.balance,
                seqno: state.seqno,
                transactions: [
                    ...transactions.map((t) => {

                        // Update
                        if (!this.#txs.has(t.id)) {
                            this.#txs.set(t.id, t);
                        }

                        return { id: t.id, time: t.time };
                    })
                ],
                pending: [],
                next
            };

            // Notify
            this.engine.recoil.updater(this.#atom, this.#state);
        });

        // History
        this.#history = createHistorySync(address, this.engine);

        this.#txsAtom = atomFamily<TransactionDescription, string>({
            key: 'wallet/' + address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/txs',
            default: selectorFamily({
                key: 'wallet/' + address.toFriendly({ testOnly: AppConfig.isTestnet }) + '/txs/default',
                get: (id) => ({ get }) => {
                    console.log('Resolving transaction ' + id);
                    let base = this.#txs.get(id);
                    console.log({ base });
                    if (!base) {
                        throw Error('Invalid transaction #' + id);
                    }

                    // Metadata
                    let metadata: ContractMetadata | null = null;
                    if (base.address) {
                        metadata = get(this.engine.persistence.metadata.item(base.address).atom);
                    }

                    // Jetton master
                    let masterMetadata: JettonMasterState | null = null;
                    if (metadata && metadata.jettonWallet) {
                        masterMetadata = get(this.engine.persistence.jettonMasters.item(metadata.jettonWallet.master).atom);
                    } else if (metadata && metadata.jettonMaster && base.address) {
                        masterMetadata = get(this.engine.persistence.jettonMasters.item(base.address).atom);
                    }

                    // Operation
                    let operation = resolveOperation({
                        body: base.body,
                        amount: base.amount,
                        account: base.address || address,
                        metadata,
                        jettonMaster: masterMetadata
                    });

                    // Icon
                    let icon: string | null = null;
                    if (operation.image) {
                        let downloaded = get(this.engine.persistence.downloads.item(operation.image).atom);
                        if (downloaded) {
                            icon = FileSystem.cacheDirectory + downloaded;
                        }
                    }

                    let verified: boolean | null = null;
                    if (
                        !!metadata?.jettonWallet
                        && !!KnownJettonMasters[metadata.jettonWallet.master.toFriendly({ testOnly: AppConfig.isTestnet })]
                    ) {
                        verified = true;
                    }

                    return {
                        base,
                        metadata,
                        masterMetadata,
                        operation,
                        icon,
                        verified
                    };
                },
                dangerouslyAllowMutability: true
            }),
            dangerouslyAllowMutability: true
        });

        console.log(this.#txs)
    }

    loadMoreFromStorage(address: Address, nextTx: Transaction) {
        // Resolve hasMore flag
        let next: { lt: string, hash: string } | null = null;

        const transactions: Transaction[] = [];

        // Push next
        transactions.push(nextTx);

        if (nextTx.prev) {
            next = { lt: nextTx.prev.lt, hash: nextTx.prev.hash };
        }

        // Resolve updated state
        if (this.#state) {

            for (let i = 0; i < 20 - 1; i++) {

                // Stop if no previous
                if (!next) {
                    break;
                }

                let tx = this.engine.transactions.get(address, next.lt);

                // Stop if not found in storage
                if (!tx) {
                    break;
                }

                transactions.push(tx);

                if (tx.prev) {
                    next = { lt: tx.prev.lt, hash: tx.prev.hash };
                } else { // No next found
                    next = null;
                }
            }

            // Resolve updated state
            this.#state = {
                balance: this.#state.balance,
                seqno: this.#state.seqno,
                transactions: [
                    ...this.#state.transactions,
                    ...transactions.map((t) => {

                        // Update
                        if (!this.#txs.has(t.id)) {
                            this.#txs.set(t.id, t);
                        }

                        return { id: t.id, time: t.time };
                    })
                ],
                pending: [],
                next
            };

            // Notify
            this.engine.recoil.updater(this.#atom, this.#state);
        }
    }

    loadMore = (address: Address, lt: string, hash: string) => {
        let tx = this.engine.transactions.get(this.engine.address, lt);
        // If found in storage 
        if (tx) {
            this.loadMoreFromStorage(address, tx);
            return;
        }
        // Load more from server
        this.#history?.loadMore(lt, hash);
    }

    startHints(address: Address, engine: Engine, owner: Address) {
        let k = address.toFriendly({ testOnly: AppConfig.isTestnet });
        if (this.#hintsStarted.has(k)) {
            return;
        }
        this.#hintsStarted.add(k);
        startHintSync(address, engine, owner);
    }

    startHintsSync(address: Address) {
        console.log(`Starting hints sync for ${address.toFriendly({ testOnly: AppConfig.isTestnet })}...`);
        startAddressHintsSync(address, this.engine);
        startHintsTxSync(address, this.engine, address);

        this.engine.persistence.accountHints.item(address).for((e) => {
            for (let addr of e) {
                this.startHints(addr, this.engine, address);
            }
        });
    }
}