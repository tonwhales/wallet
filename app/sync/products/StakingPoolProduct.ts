import { Engine } from "../Engine";
import EventEmitter from "events";
import { backoff } from "../../utils/time";
import React from "react";
import { fetchStakingPool } from "../fetchStakingPool";
import { watchStakingPool } from "../watchStakingPool";
import { StakingPool } from "../../utils/KnownPools";
import BN from "bn.js";
import { StakingPersisted } from "../Persistence";

export type StakingPoolState = {
    params: {
        minStake: BN,
        depositFee: BN,
        withdrawFee: BN,
        stakeUntil: number,
        receiptPrice: BN
    },
    member: {
        balance: BN,
        pendingDeposit: BN,
        pendingWithdraw: BN,
        withdraw: BN
    }
}

function stateToPersistence(src: StakingPoolState): StakingPersisted {
    return {
        params: {
            minStake: src.params.minStake.toString(10),
            depositFee: src.params.depositFee.toString(10),
            withdrawFee: src.params.withdrawFee.toString(10),
            stakeUntil: src.params.stakeUntil,
            receiptPrice: src.params.receiptPrice.toString(10)
        },
        member: {
            balance: src.member.balance.toString(10),
            pendingDeposit: src.member.pendingDeposit.toString(10),
            pendingWithdraw: src.member.pendingWithdraw.toString(10),
            withdraw: src.member.withdraw.toString(10)
        }
    }
}

export class StakingPoolProduct {
    readonly engine: Engine;
    private _state: StakingPoolState | null = null;
    private _eventEmitter: EventEmitter = new EventEmitter();
    private _destroyed: boolean;
    private _pool: StakingPool;
    private _watched: (() => void) | null = null;

    constructor(engine: Engine, pool: StakingPool) {
        this.engine = engine;
        this._pool = pool;
        let ex = engine.persistence.staking.getValue({ address: pool.address, target: engine.address });
        if (ex) {
            this._state = {
                params: {
                    minStake: new BN(ex.params.minStake, 10),
                    depositFee: new BN(ex.params.depositFee, 10),
                    withdrawFee: new BN(ex.params.withdrawFee, 10),
                    stakeUntil: ex.params.stakeUntil,
                    receiptPrice: new BN(ex.params.receiptPrice, 10)
                },
                member: {
                    balance: new BN(ex.member.balance, 10),
                    pendingDeposit: new BN(ex.member.pendingDeposit, 10),
                    pendingWithdraw: new BN(ex.member.pendingWithdraw, 10),
                    withdraw: new BN(ex.member.withdraw, 10)
                }
            };
        }
        this._destroyed = false;
        this._start();
    }

    get ready() {
        return !!this._state;
    }

    get state() {
        if (!this._state) {
            throw Error('Not ready');
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
                    return await fetchStakingPool(this.engine, this._pool.address, this.engine.address);
                });
                if (!initialState) {
                    return;
                }
                if (this._destroyed) {
                    return;
                }

                // Apply state
                this._state = initialState;
                this.engine.persistence.staking.setValue({ address: this._pool.address, target: this.engine.address }, stateToPersistence(this._state));
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
        this._watched = watchStakingPool(this.engine, this._pool, this.engine.address, async (newState) => {
            this._state = newState;
            this.engine.persistence.staking.setValue({ address: this._pool.address, target: this.engine.address }, stateToPersistence(newState));
            this._eventEmitter.emit('updated');
        });
    }
}