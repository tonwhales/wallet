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
        // this._watched = this.connector.watchAccountState(this.address, async (state) => {
        //     // TODO: Apply
        // });
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