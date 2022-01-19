import * as React from 'react';
import { MMKV } from "react-native-mmkv";
import { Address } from "ton";
import { SimpleTransaction } from "../client";
import { AccountStatus, createCache } from "../storage/cache";
import { backoff } from "../utils/time";
import { Connector } from "./Connector";
import { EventEmitter } from 'events';

export class Engine {
    readonly address: Address;
    readonly cache;
    readonly connector: Connector;
    private _account: AccountStatus | null;
    private _destroyed: boolean;
    private _watched: (() => void) | null = null;
    private _eventEmitter: EventEmitter = new EventEmitter();

    constructor(address: Address, cache: MMKV, connector: Connector) {
        this.cache = createCache(cache);
        this.address = address;
        this.connector = connector;
        this._account = this.cache.loadState(address);
        this._destroyed = false;
        this.start();
    }

    get ready() {
        return !!this._account;
    }

    get state() {
        if (!this._account) {
            throw Error('Not ready');
        }
        return this._account;
    }

    awaitReady() {
        return new Promise<void>((resolve) => {
            if (this.ready) {
                resolve();
            } else {
                this._eventEmitter.once('ready', resolve);
            }
        });
    }

    useState() {
        const [state, setState] = React.useState(this.state);
        React.useEffect(() => {

            // Just in case of race conditions
            if (state !== this.state) {
                setState(this.state);
            }

            return () => {

            };
        }, []);
        return state;
    }

    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
            if (this._watched) {
                this._watched();
            }
        }
    }

    private start() {
        if (!this._account) {
            backoff(async () => {
                // Fetch initial
                const initial = await fetchAccountStateInitial(this.address, this.connector);
                if (this._destroyed) {
                    return;
                }

                // Persist transactions
                for (let tx of initial.txs) {
                    this.cache.storeTransaction(this.address, tx.id.lt, tx.data);
                }

                // Convert values
                const status: AccountStatus = {
                    balance: initial.status.balance,
                    state: initial.status.state,
                    syncTime: initial.status.timestamp,
                    storedAt: Date.now(),
                    lastTransaction: initial.status.lastTransaction,
                    seqno: 0, // TODO
                    transactionCursor: initial.txs.length > 0 ? initial.txs[initial.txs.length - 1].id : null,
                    transactions: initial.txs.map((v) => v.id.lt)
                }

                // Update in memory
                this._account = status;
                // Update storage
                this.cache.storeState(this.address, status);
                // Notify ready
                this._eventEmitter.emit('ready');

                // Start sync
                this.startSync();
            });
        } else {
            // Start sync
            this.startSync();
        }
    }

    private startSync() {
        if (this._destroyed) {
            return;
        }

        // Start sync
        this._watched = this.connector.watchAccountState(this.address, async (newState) => {

            // Check if changed
            const currentStatus = this._account!
            let changed = false;
            if (!newState.balance.eq(currentStatus.balance)) {
                changed = true;
            }
            if (newState.state !== currentStatus.state) {
                changed = true;
            }
            if (newState.lastTransaction === null && currentStatus.lastTransaction !== null) {
                changed = true;
            }
            if (newState.lastTransaction !== null && currentStatus.lastTransaction === null) {
                changed = true;
            }
            if (newState.lastTransaction !== null && currentStatus.lastTransaction !== null && (newState.lastTransaction.lt !== currentStatus.lastTransaction.lt)) {
                changed = true;
            }
            if (!changed) {
                this._account = {
                    ...currentStatus,
                    storedAt: Date.now()
                };
                this.cache.storeState(this.address, this._account!);
                this._eventEmitter.emit('updated');
                return;
            }

            let txs: SimpleTransaction[] = [];
            let transactionCursor: { lt: string, hash: string } | null = null;
            let transactions: string[] = currentStatus.transactions;

            // Got first transaction: reset to zero
            if (newState.lastTransaction && !currentStatus.lastTransaction) {
                txs = await backoff(() => this.connector.fetchTransactions(this.address, newState.lastTransaction!));
                if (txs.length < 100) {
                    transactionCursor = txs[txs.length - 1].id;
                } else {
                    transactionCursor = null;
                }
                transactions = txs.map((v) => v.id.lt);
            }

            // Lost last transaction: got frozen?
            if (!newState.lastTransaction && !!currentStatus.lastTransaction) {
                txs = [];
                transactions = [];
                transactionCursor = null;
            }

            // Updated transactions
            if (!!newState.lastTransaction && !!currentStatus.lastTransaction && (newState.lastTransaction.lt !== currentStatus.lastTransaction.lt)) {
                let found = false;

                let ttxs = await backoff(() => this.connector.fetchTransactions(this.address, newState.lastTransaction!));
                for (let t of ttxs) {
                    if (t.id.lt === currentStatus.lastTransaction.lt) {
                        found = true;
                        break;
                    }
                    txs.push(t);
                }

                // Apply update
                if (!found) {
                    transactionCursor = ttxs[ttxs.length - 1].id;
                    transactions = ttxs.map((v) => v.id.lt);
                } else {
                    transactionCursor = currentStatus.transactionCursor;
                    transactions = [...txs.map((v) => v.id.lt), ...currentStatus.transactions];
                }
            }

            // Persist transactions
            for (let t of txs) {
                this.cache.storeTransaction(this.address, t.id.lt, t.data);
            }

            // Apply
            // this._account = {
            //     balance: newState.balance,
            //     ...currentStatus,
            //     storedAt: Date.now()
            // };
            // this.cache.storeState(this.address, this._account!);
            // this._eventEmitter.emit('updated');

            // status: {
            //     balance: res.balance,
            //     state: res.state,
            //     lastTransaction: res.lastTransaction,
            //     syncTime: res.timestamp,
            //     storedAt: Date.now(),
            //     transactionCursor,
            //     loadedTransactions,
            //     transactions
            // }
        });
    }
}

async function fetchAccountStateInitial(address: Address, connector: Connector) {
    const status = await backoff(() => connector.fetchAccountState(address));
    let txs: SimpleTransaction[] = [];
    const last = status.lastTransaction;
    if (last) {
        txs = await backoff(() => connector.fetchTransactions(address, last));
    }
    return {
        txs,
        status
    };
}

// Context
export const EngineContext = React.createContext<Engine | null>(null);