import * as React from 'react';
import { MMKV } from "react-native-mmkv";
import { Address, Cell, parseTransaction } from "ton";
import { AccountStatus, createCache } from "../storage/cache";
import { backoff } from "../utils/time";
import { Connector } from "./Connector";
import { EventEmitter } from 'events';
import BN from 'bn.js';
import { Transaction } from './Transaction';
import { parseWalletTransaction } from './parse/parseWalletTransaction';

function extractSeqno(data: Cell) {
    const slice = data.beginParse();
    return slice.readUintNumber(32);
}

function hasPreviousTransaction(src: Buffer) {
    const lastTx = parseTransaction(0, Cell.fromBoc(src)[0].beginParse());
    return !lastTx.prevTransaction.lt.eq(new BN(0));
}

export type SimpleTransaction = {
    utime: number,
    id: { lt: string, hash: string },
    data: string
}

export class Engine {
    readonly address: Address;
    readonly cache;
    readonly connector: Connector;
    private _account: AccountStatus | null;
    private _destroyed: boolean;
    private _watched: (() => void) | null = null;
    private _eventEmitter: EventEmitter = new EventEmitter();
    private _txs = new Map<string, Transaction>();

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

    getTransaction(lt: string) {
        let ex = this._txs.get(lt);
        if (ex) {
            return ex;
        }
        let parsed = parseTransaction(0, this.cache.loadTransaction(this.address, lt)!.beginParse());
        let parsed2 = parseWalletTransaction(parsed);
        this._txs.set(lt, parsed2);
        return parsed2;
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

            this._eventEmitter.on('updated', handler);
            return () => {
                ended = true;
                this._eventEmitter.off('updated', handler);
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

                // Fetch initial state
                const initialState = await backoff(async () => {
                    if (this._destroyed) {
                        return null;
                    }
                    return await this.connector.fetchAccountState(this.address)
                });
                if (!initialState) {
                    return;
                }
                if (this._destroyed) {
                    return;
                }

                // Fetch initial transactions
                let txs: SimpleTransaction[] = [];
                let transactionCursor: { lt: string, hash: string } | null = null;
                const last = initialState.lastTransaction;
                if (last) {
                    let t = await backoff(async () => {
                        if (this._destroyed) {
                            return null;
                        }
                        return await this.connector.fetchTransactions(this.address, last);
                    });
                    if (!t) {
                        return;
                    }
                    if (this._destroyed) {
                        return;
                    }
                    txs = t;
                }

                // Resolve cursor
                if (txs.length > 0) {
                    if (hasPreviousTransaction(Buffer.from(txs[txs.length - 1].data, 'base64'))) {
                        transactionCursor = txs[txs.length - 1].id;
                    }
                }

                // Persist transactions
                for (let tx of txs) {
                    this.cache.storeTransaction(this.address, tx.id.lt, tx.data);
                }

                // Extract seqno
                let seqno = 0;
                if (initialState.data) {
                    seqno = extractSeqno(Cell.fromBoc(initialState.data)[0]);
                }

                // Convert values
                const status: AccountStatus = {
                    balance: initialState.balance,
                    state: initialState.state,
                    syncTime: initialState.timestamp,
                    storedAt: Date.now(),
                    lastTransaction: initialState.lastTransaction,
                    seqno,
                    transactionCursor: txs.length > 0 ? txs[txs.length - 1].id : null,
                    transactions: txs.map((v) => v.id.lt),
                    pending: []
                }

                // Persist account state
                this._account = status;
                this.cache.storeState(this.address, status);
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

            // Check if state is new
            if (newState.timestamp <= this._account!.syncTime) {
                return;
            }

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
            let seqno = 0;
            if (newState.data) {
                seqno = extractSeqno(Cell.fromBoc(newState.data)[0]);
            }
            if (!changed) {
                this._account = {
                    ...currentStatus,
                    seqno,
                    syncTime: newState.timestamp,
                    storedAt: Date.now(),
                    pending: currentStatus.pending.filter((v) => v.seqno !== null && v.seqno >= seqno)
                };
                this.cache.storeState(this.address, this._account!);
                this._eventEmitter.emit('updated');
                return;
            }

            let txs: SimpleTransaction[] = [];
            let transactionCursor: { lt: string, hash: string } | null = null;
            let transactions: string[] = currentStatus.transactions;

            // Got first transaction: reset to zero
            if (!currentStatus.lastTransaction && !!newState.lastTransaction) {
                let t = await backoff(async () => {
                    if (this._destroyed) {
                        return null;
                    }
                    return await this.connector.fetchTransactions(this.address, newState.lastTransaction!);
                });
                if (!t) {
                    return;
                }
                if (this._destroyed) {
                    return;
                }
                txs = t;
                transactions = txs.map((v) => v.id.lt);
                if (txs.length > 0) {
                    if (hasPreviousTransaction(Buffer.from(txs[txs.length - 1].data, 'base64'))) {
                        transactionCursor = txs[txs.length - 1].id;
                    }
                }
            }

            // Lost last transaction: got frozen?
            if (!!currentStatus.lastTransaction && !newState.lastTransaction) {
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
                    if (ttxs.length > 0) {
                        transactions = ttxs.map((v) => v.id.lt);
                        transactionCursor = ttxs[ttxs.length - 1].id;
                    } else {
                        if (hasPreviousTransaction(Buffer.from(ttxs[ttxs.length - 1].data, 'base64'))) {
                            transactionCursor = ttxs[ttxs.length - 1].id;
                        } else {
                            transactionCursor = null;
                        }
                        transactions = ttxs.map((v) => v.id.lt);
                    }
                } else {
                    transactionCursor = currentStatus.transactionCursor;
                    transactions = [...txs.map((v) => v.id.lt), ...currentStatus.transactions];
                }
            }

            // Skip if destroyed
            if (this._destroyed) {
                return;
            }

            // Persist transactions
            for (let t of txs) {
                this.cache.storeTransaction(this.address, t.id.lt, t.data);
            }

            // Persist account
            this._account = {
                ...currentStatus,
                balance: newState.balance,
                state: newState.state,
                lastTransaction: newState.lastTransaction,
                syncTime: newState.timestamp,
                storedAt: Date.now(),
                transactions,
                transactionCursor,
                seqno,
                pending: currentStatus.pending.filter((v) => v.seqno !== null && v.seqno >= seqno)
            };
            this.cache.storeState(this.address, this._account!);
            this._eventEmitter.emit('updated');
        });
    }
}

// Context
export const EngineContext = React.createContext<Engine | null>(null);

// Account
export function useAccount(): [AccountStatus, Engine] {
    const engine = React.useContext(EngineContext)!
    return [engine.useState(), engine];
}