import * as React from 'react';
import EventEmitter from "events";
import { SyncValue } from "teslabot";
import { Address } from "ton";
import { Engine } from "../../Engine";
import { PersistedCollection } from "../../PersistedCollection";
import { AccountFullSync, FullAccount } from "../AccountFullSync";

export interface SmartAccountSync<T> {
    emit(event: 'account_ready', data: { address: Address, account: FullAccount, state: T }): boolean;
    on(event: 'account_ready', listener: (data: { address: Address, account: FullAccount, state: T }) => void): this;
    off(event: 'account_ready', listener: (data: { address: Address, account: FullAccount, state: T }) => void): this;
    once(event: 'account_ready', listener: (data: { address: Address, account: FullAccount, state: T }) => void): this;

    emit(event: 'account_updated', data: { address: Address, account: FullAccount, state: T }): boolean;
    on(event: 'account_updated', listener: (data: { address: Address, account: FullAccount, state: T }) => void): this;
    off(event: 'account_updated', listener: (data: { address: Address, account: FullAccount, state: T }) => void): this;
    once(event: 'account_updated', listener: (data: { address: Address, account: FullAccount, state: T }) => void): this;
}
export class SmartAccountSync<T> extends EventEmitter {

    readonly key: string;
    readonly engine: Engine;
    readonly address: Address;
    readonly extractor: (src: FullAccount) => Promise<T>;
    readonly collection: PersistedCollection<Address, T>;
    readonly accountSync: AccountFullSync;
    #sync: SyncValue<FullAccount | null>;
    #state: T | null = null;
    #stateBlock: number | null = null;

    constructor(args: {
        key: string,
        address: Address,
        extractor: (src: FullAccount) => Promise<T>,
        collection: PersistedCollection<Address, T>,
        engine: Engine
    }) {
        super();
        this.key = args.key;
        this.engine = args.engine;
        this.address = args.address;
        this.extractor = args.extractor;
        this.collection = args.collection;

        // Sync logic
        this.accountSync = this.engine.accounts.getFullSyncForAddress(args.address);
        this.#sync = new SyncValue<FullAccount | null>(null, async (value) => {
            if (!value) {
                return;
            }
            if (this.#stateBlock && this.#stateBlock >= value.block) {
                return;
            }

            // Processing
            console.log(`[${this.key}]: Updating at #` + value.block);
            let extracted = await this.extractor(value);

            // Persist
            this.collection.setValue(this.address, extracted);
            this.engine.persistence.smartCursors.setValue({ key: this.key, address: this.address }, value.block);

            // Update state
            let first = !this.#state;
            this.#state = extracted;
            this.#stateBlock = value.block;

            // Notify
            if (first) {
                this.emit('account_ready', { address: this.address, account: value, state: this.#state });
            } else {
                this.emit('account_updated', { address: this.address, account: value, state: this.#state });
            }
        });

        // Initial state
        let exBlock = this.engine.persistence.smartCursors.getValue({ key: this.key, address: this.address });
        let ex = this.collection.getValue(this.address);
        if (ex && exBlock) {
            this.#state = ex;
            this.#stateBlock = exBlock;
        } else {
            this.#state = null;
            this.#stateBlock = null;
        }

        // Initial sync state
        if (this.accountSync.ready) {
            this.#sync.value = this.accountSync.state;
        }

        // Subscribe
        this.accountSync.on('account_ready', (data) => {
            this.#sync.value = data.state;
        });
        this.accountSync.on('account_updated', (data) => {
            this.#sync.value = data.state;
        });
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