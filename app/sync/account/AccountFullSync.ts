import * as React from 'react';
import BN from "bn.js";
import { Address, Cell, parseTransaction } from "ton";
import { AccountState, AccountWatcher } from "../blocks/AccountWatcher";
import { Engine } from "../Engine";
import EventEmitter from 'events';
import { SyncValue } from 'teslabot';
import { backoff } from '../../utils/time';
import { AppConfig } from '../../AppConfig';

export type FullAccount = {
    balance: BN;
    last: { lt: BN, hash: string } | null;
    block: number;

    transactionsCursor: { lt: BN, hash: string } | null;
    transactions: string[];
}

export interface AccountFullSync {
    emit(event: 'account_ready', data: { address: Address, state: FullAccount }): boolean;
    on(event: 'account_ready', listener: (data: { address: Address, state: FullAccount }) => void): this;
    off(event: 'account_ready', listener: (data: { address: Address, state: FullAccount }) => void): this;
    once(event: 'account_ready', listener: (data: { address: Address, state: FullAccount }) => void): this;

    emit(event: 'account_updated', data: { address: Address, state: FullAccount }): boolean;
    on(event: 'account_updated', listener: (data: { address: Address, state: FullAccount }) => void): this;
    off(event: 'account_updated', listener: (data: { address: Address, state: FullAccount }) => void): this;
    once(event: 'account_updated', listener: (data: { address: Address, state: FullAccount }) => void): this;
}

export class AccountFullSync extends EventEmitter {
    readonly address: Address;
    readonly engine: Engine;
    #watcher: AccountWatcher;
    #state: FullAccount | null = null;
    #sync: SyncValue<AccountState | null>

    constructor(address: Address, engine: Engine) {
        super();
        this.address = address;
        this.engine = engine;

        this.#sync = new SyncValue<AccountState | null>(null, async (v) => {
            if (!v) {
                return;
            }

            // Check if not changed
            if (this.#state) {

                // If both are not null
                if (this.#state.last && v.last) {
                    if (this.#state.last.lt.eq(new BN(v.last.lt))) {
                        console.log(`[${this.address.toFriendly()}]: Ignore since last is same`);
                        return;
                    }
                }

                // If both null
                if ((!this.#state.last) && (!v.last)) {
                    console.log(`[${this.address.toFriendly()}]: Ignore since last both empty`);
                    return;
                }
            }

            // Persist first flag
            let first = !this.#state;

            // Load related transactions
            let transactions: string[] = [];
            let transactionsCursor: { lt: BN, hash: string } | null = null;

            // Load transactions if needed
            if (!!v.last) {

                // Download transactions
                let loadedTransactions = await backoff(async () => {
                    return await this.engine.connector.fetchTransactions(this.address, v.last!);
                });

                // Download introspection
                let mentioned = new Set<string>();
                for (let t of loadedTransactions) {
                    let txData = Buffer.from(t.data, 'base64');
                    let tx = parseTransaction(0, Cell.fromBoc(txData)[0].beginParse());
                    if (tx.inMessage && tx.inMessage.info.src) {
                        mentioned.add(tx.inMessage.info.src.toFriendly({ testOnly: AppConfig.isTestnet }));
                    }
                    for (let out of tx.outMessages) {
                        if (out.info.dest) {
                            mentioned.add(out.info.dest.toFriendly({ testOnly: AppConfig.isTestnet }));
                        }
                    }
                }

                // Prepare metadata
                await Promise.all(Array.from(mentioned).map((src) => backoff(() => engine.metadata.prepareMetadata(v.seqno, Address.parse(src)))));

                // Persist transactions
                for (let l of loadedTransactions) {
                    engine.transactions.set(address, l.id.lt, l.data);
                }

                // Transaction ids
                for (let l of loadedTransactions) {
                    transactions.push(l.id.lt);
                }

                // Read previous transaction
                if (loadedTransactions.length > 0) {
                    let txData = Buffer.from(loadedTransactions[loadedTransactions.length - 1].data, 'base64');
                    const lastTx = parseTransaction(0, Cell.fromBoc(txData)[0].beginParse());
                    if (!lastTx.prevTransaction.lt.eq(new BN(0))) {
                        transactionsCursor = { lt: lastTx.prevTransaction.lt, hash: lastTx.prevTransaction.hash.toString('base64') };
                    }
                }
            }

            // Check for holes
            if (this.#state) {

                // Try to merge transactions
                if (this.#state.last) {
                    let combined: string[] = [];

                    let lastLt = this.#state.last.lt.toString(10);
                    let found = false;

                    // Put all transactions until we reach last persisted
                    for (let t of transactions) {
                        if (t === lastLt) {
                            found = true;
                            break;
                        }
                        combined.push(t);
                    }

                    // Put all persisted transactions
                    if (found) {
                        for (let t of this.#state.transactions) {
                            combined.push(t);
                        }
                        // Get persisted transaction
                        transactionsCursor = this.#state.transactionsCursor;
                    }

                    // Use combined transactions
                    transactions = combined;
                }
            }

            // Update state
            this.#state = {
                balance: v.balance,
                last: v.last ? { lt: new BN(v.last.lt, 10), hash: v.last.hash } : null,
                block: v.seqno,
                transactionsCursor,
                transactions
            };

            // Persist state
            engine.persistence.fullAccounts.setValue(this.address, {
                balance: v.balance.toString(10),
                last: v.last ? { lt: v.last.lt, hash: v.last.hash } : null,
                block: v.seqno,
                transactions,
                transactionCursor: transactionsCursor ? { lt: transactionsCursor.lt.toString(10), hash: transactionsCursor.hash } : null
            });

            // Notify
            if (first) {
                this.emit('account_ready', { address, state: this.#state });
            } else {
                this.emit('account_updated', { address, state: this.#state });
            }
        });

        this.#watcher = engine.accounts.getWatcherForAddress(address);
        this.#watcher.on('account_changed', (account) => {
            this.#sync.value = account.state;
        });

        // Load from cache
        let cached = engine.persistence.fullAccounts.getValue(this.address);
        if (cached) {
            this.#state = {
                balance: new BN(cached.balance, 10),
                last: cached.last ? { lt: new BN(cached.last.lt, 10), hash: cached.last.hash } : null,
                block: cached.block,
                transactions: cached.transactions,
                transactionsCursor: cached.transactionCursor ? { lt: new BN(cached.transactionCursor.lt, 10), hash: cached.transactionCursor.hash } : null
            };
        }
    }

    get state() {
        if (!this.#state) {
            throw Error('Not ready');
        }
        return this.#state!
    }

    get ready() {
        return !!this.#state;
    }

    useState() {
        const [state, setState] = React.useState(this.state);
        React.useEffect(() => {

            let ended = false;

            // Just in case of race conditions
            if (state !== this.state) {
                setState(this.state);
            }

            // Update handler
            const handler = () => {
                if (ended) {
                    return;
                }
                setState(this.state);
            }

            this.on('account_updated', handler);
            return () => {
                ended = true;
                this.off('account_updated', handler);
            };
        }, []);
        return state;
    }

    async awaitReady() {
        await new Promise<void>((resolve) => {
            if (this.ready) {
                resolve();
            } else {
                this.once('account_ready', () => resolve());
            }
        });
    }
}