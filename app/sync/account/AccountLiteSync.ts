import * as React from 'react';
import BN from "bn.js";
import { Address } from "ton";
import { AccountWatcher } from "../blocks/AccountWatcher";
import { Engine } from "../Engine";
import EventEmitter from 'events';

export type LiteAccount = {
    balance: BN;
    last: { lt: BN, hash: string } | null;
    block: number;
}

export interface AccountLiteSync {
    emit(event: 'account_ready', data: { address: Address, state: LiteAccount }): boolean;
    on(event: 'account_ready', listener: (data: { address: Address, state: LiteAccount }) => void): this;
    off(event: 'account_ready', listener: (data: { address: Address, state: LiteAccount }) => void): this;
    once(event: 'account_ready', listener: (data: { address: Address, state: LiteAccount }) => void): this;

    emit(event: 'account_updated', data: { address: Address, state: LiteAccount }): boolean;
    on(event: 'account_updated', listener: (data: { address: Address, state: LiteAccount }) => void): this;
    off(event: 'account_updated', listener: (data: { address: Address, state: LiteAccount }) => void): this;
    once(event: 'account_updated', listener: (data: { address: Address, state: LiteAccount }) => void): this;
}

export class AccountLiteSync extends EventEmitter {
    readonly address: Address;
    readonly engine: Engine;
    #watcher: AccountWatcher;
    #state: LiteAccount | null = null;

    constructor(address: Address, engine: Engine) {
        super();
        this.address = address;
        this.engine = engine;

        this.#watcher = engine.accounts.getWatcherForAddress(address);
        this.#watcher.on('account_changed', (account) => {

            // Persist
            engine.persistence.liteAccounts.setValue(this.address, {
                balance: account.state.balance.toString(10),
                last: account.state.last ? { lt: account.state.last.lt, hash: account.state.last.hash } : null,
                block: account.state.seqno
            });

            // Update local
            let first = !this.#state;
            this.#state = {
                balance: account.state.balance,
                last: account.state.last ? { lt: new BN(account.state.last.lt, 10), hash: account.state.last.hash } : null,
                block: account.state.seqno
            };

            // Notify
            if (first) {
                this.emit('account_ready', { address, state: this.#state });
            } else {
                this.emit('account_updated', { address, state: this.#state });
            }
        });

        // Load from cache
        let cached = engine.persistence.liteAccounts.getValue(this.address);
        if (cached) {
            this.#state = {
                balance: new BN(cached.balance, 10),
                last: cached.last ? { lt: new BN(cached.last.lt, 10), hash: cached.last.hash } : null,
                block: cached.block
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