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
import { OldWalletsProduct } from './products/OldWalletsProduct';
import { AddressProduct } from './products/AddressProduct';
import { AppConfig } from '../AppConfig';
import { PriceProduct } from './products/PriceProduct';
import { StakingPoolProduct } from './products/StakingPoolProduct';
import { JobsProduct } from './products/JobsProduct';

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

export type AccountState = {
    // State
    balance: BN,
    state: 'active' | 'uninitialized' | 'frozen',
    seqno: number,
    lastTransaction: { lt: string, hash: string } | null,
    syncTime: number, // Account sync time
    storedAt: number, // When it was updated in the store

    // Transactions
    transactionCursor: { lt: string, hash: string } | null,
    transactions: string[],

    // Pending
    pending: Transaction[]
};

export type EngineProduct = {
    ready: boolean,
    awaitReady: () => Promise<void>
}

export class Engine {
    readonly address: Address;
    readonly publicKey: Buffer;
    readonly cache;
    readonly connector: Connector;
    readonly products;
    private _state: AccountState | null;
    private _account: AccountStatus | null;
    private _destroyed: boolean;
    private _watched: (() => void) | null = null;
    private _eventEmitter: EventEmitter = new EventEmitter();
    private _txs = new Map<string, Transaction>();
    private _pending: Transaction[] = [];
    private _products = new Map<string, EngineProduct>();

    constructor(
        address: Address,
        publicKey: Buffer,
        cache: MMKV,
        connector: Connector
    ) {
        this.cache = createCache(cache);
        this.address = address;
        this.publicKey = publicKey;
        this.connector = connector;
        this._account = this.cache.loadState(address);
        this._state = this._account ? { ...this._account, pending: [] } : null;
        this._destroyed = false;
        this.start();

        this.products = {
            oldWallets: new OldWalletsProduct(this),
            price: this.createPriceProduct(),
            stakingPool: this.createStakingPoolProduct(),
            apps: new JobsProduct(this)
        };
        this._products.set('apps', this.products.apps);
    }

    get ready() {
        if (!this._state) {
            return false;
        }
        for (let p of this._products.values()) {
            if (!p.ready) {
                return false;
            }
        }
        return true;
    }

    async awaitReady() {
        await new Promise<void>((resolve) => {
            if (this._state) {
                resolve();
            } else {
                this._eventEmitter.once('ready', resolve);
            }
        });
        for (let p of this._products.values()) {
            await p.awaitReady();
        }
    }

    get state() {
        if (!this._state) {
            throw Error('Not ready');
        }
        return this._state;
    }

    createPriceProduct(): PriceProduct {
        const key = 'price_product';
        let ex = this._products.get(key);
        if (ex) return ex as PriceProduct;
        let n = new PriceProduct(this);
        this._products.set(key, n);
        return n;
    }

    createStakingPoolProduct(): StakingPoolProduct {
        const key = 'staking_pool_product';
        let ex = this._products.get(key);
        if (ex) return ex as StakingPoolProduct;
        let n = new StakingPoolProduct(this);
        this._products.set(key, n);
        return n;
    }

    createAddressProduct(address: Address) {
        const key = address.toFriendly({ testOnly: AppConfig.isTestnet });
        let ex = this._products.get(key);
        if (ex) {
            return ex as AddressProduct;
        }
        let n = new AddressProduct(address, this);
        this._products.set(key, n);
        return n;
    }

    registerPending(src: Transaction) {
        if (!this._account) {
            return;
        }
        if (src.seqno === null) {
            return;
        }
        if (src.seqno < this._account!.seqno) {
            return;
        }
        if (src.status !== 'pending') {
            return;
        }
        this._pending = [src, ...this._pending];
        this._state = { ...this._account, pending: this._pending };
        this._eventEmitter.emit('updated');
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
                    transactions: txs.map((v) => v.id.lt)
                }

                // Persist account state
                this._account = status;
                this._state = { ...status, pending: [] };
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
                seqno
            };
            this.cache.storeState(this.address, this._account!);

            // Update pending
            this._updatePendingIfNeeded();

            // Update state
            this._state = { ...this._account, pending: this._pending };

            // Emit event
            this._eventEmitter.emit('updated');
        });
    }

    private _updatePendingIfNeeded = () => {
        if (this._pending.find((v) => v.seqno! < this._account!.seqno)) {
            this._pending = this._pending.filter((v) => v.seqno! >= this._account!.seqno);
        }
    };
}

// Context
export const EngineContext = React.createContext<Engine | null>(null);

// Account
export function useAccount(): [AccountState, Engine] {
    const engine = React.useContext(EngineContext)!
    return [engine.useState(), engine];
}