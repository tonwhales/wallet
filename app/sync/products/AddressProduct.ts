import * as React from 'react';
import EventEmitter from "events";
import { Address, Cell } from "ton";
import { AddressState } from "../../storage/cache";
import { backoff } from "../../utils/time";
import { Engine } from "../Engine";

export class AddressProduct {

    readonly engine: Engine;
    readonly address: Address;
    private _state: AddressState | null = null;
    private _eventEmitter: EventEmitter = new EventEmitter();
    private _destroyed: boolean;
    private _watched: (() => void) | null = null;

    constructor(address: Address, engine: Engine) {
        this.address = address;
        this.engine = engine;
        this._state = engine.cache.loadAddressState(address);
        this._destroyed = false;
        this._start();
    }

    get ready() {
        return !!this._state;
    }

    get state() {
        if (!this._state) {
            throw Error('Address not ready');
        }
        return this._state;
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

    async awaitReady() {
        await new Promise<void>((resolve) => {
            if (this.ready) {
                resolve();
            } else {
                this._eventEmitter.once('ready', resolve);
            }
        });
    }

    private _start() {
        if (!this._state) {
            backoff(async () => {

                // Fetch initial state
                const initialState = await backoff(async () => {
                    if (this._destroyed) {
                        return null;
                    }
                    return await this.engine.connector.fetchAccountState(this.address)
                });
                if (!initialState) {
                    return;
                }
                if (this._destroyed) {
                    return;
                }

                // Apply state
                this._state = {
                    balance: initialState.balance,
                    state: initialState.state,
                    syncTime: initialState.timestamp,
                    storedAt: Date.now(),
                    lastTransaction: initialState.lastTransaction,
                    code: initialState.code ? Cell.fromBoc(initialState.code)[0] : null,
                    data: initialState.data ? Cell.fromBoc(initialState.data)[0] : null,
                };
                this.engine.cache.storeAddressState(this.address, this._state);
                console.log('emit ready: ' + this.address.toFriendly())
                this._eventEmitter.emit('ready');

                // Start sync
                this._startSync();
            });
        } else {
            // Start sync
            this._startSync();
        }
    }

    private _startSync() {
        if (this._destroyed) {
            return;
        }

        // Start sync
        this._watched = this.engine.connector.watchAccountState(this.address, async (newState) => {

            // Check if state is new
            if (newState.timestamp <= this._state!.syncTime) {
                return;
            }

            // Check if changed
            const currentStatus = this._state!
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

            // If not changed
            if (!changed) {
                this._state = {
                    ...currentStatus,
                    code: newState.code ? Cell.fromBoc(newState.code)[0] : null,
                    data: newState.data ? Cell.fromBoc(newState.data)[0] : null,
                    syncTime: newState.timestamp,
                    storedAt: Date.now()
                };
                this.engine.cache.storeAddressState(this.address, this._state!);
                this._eventEmitter.emit('updated');
                return;
            }

            this._state = {
                ...currentStatus,
                balance: newState.balance,
                state: newState.state,
                lastTransaction: newState.lastTransaction,
                code: newState.code ? Cell.fromBoc(newState.code)[0] : null,
                data: newState.data ? Cell.fromBoc(newState.data)[0] : null,
                syncTime: newState.timestamp,
                storedAt: Date.now()
            };
            this.engine.cache.storeAddressState(this.address, this._state!);
            this._eventEmitter.emit('updated');
        });
    }
}