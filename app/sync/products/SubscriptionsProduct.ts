import { Engine } from "../Engine";
import EventEmitter from "events";
import { backoff } from "../../utils/time";
import React from "react";
import { watchSubscriptions } from "../watchSubscriptions";
import { fetchSubscriptions, SubscriptionsStateData } from "../fetchSubscriptions";
import { AppConfig } from "../../AppConfig";
import { SubscriptionsPersisted } from "../Persistence";
import { Address, fromNano } from "ton";
import BN from "bn.js";
import { notEmpty } from "../../utils/notEmpty";

function stateToPersistence(src: SubscriptionsStateData): SubscriptionsPersisted {
    return {
        updatedAt: src.updatedAt,
        subscriptions: src.subscriptions.map((s) => {
            return {
                wallet: s.wallet.toFriendly({ testOnly: AppConfig.isTestnet }),
                beneficiary: s.beneficiary.toFriendly({ testOnly: AppConfig.isTestnet }),
                amount: s.amount.toString(10),
                period: s.period,
                startAt: s.startAt,
                timeout: s.timeout,
                lastPayment: s.lastPayment,
                lastRequest: s.lastRequest,
                failedAttempts: s.failedAttempts,
                subscriptionId: s.subscriptionId,
            }
        })
    };
}
export class SubscriptionsProduct {
    readonly engine: Engine;
    private _state: SubscriptionsStateData | null = null;
    private _eventEmitter: EventEmitter = new EventEmitter();
    private _destroyed: boolean;
    private _watched: (() => void) | null = null;

    constructor(engine: Engine) {
        this.engine = engine;
        let ex = engine.persistence.subscriptions.getValue(this.engine.address);
        if (ex) {

            this._state = {
                updatedAt: ex.updatedAt,
                subscriptions: ex.subscriptions.map((s) => {
                    return {
                        wallet: Address.parseFriendly(s.wallet).address,
                        beneficiary: Address.parseFriendly(s.beneficiary).address,
                        amount: new BN(s.amount, 10),
                        period: s.period,
                        startAt: s.startAt,
                        timeout: s.timeout,
                        lastPayment: s.lastPayment,
                        lastRequest: s.lastRequest,
                        failedAttempts: s.failedAttempts,
                        subscriptionId: s.subscriptionId,
                    };
                }).filter(notEmpty)
            }
        }
        this._destroyed = false;
        this._start();
    }

    get ready() {
        return true;
    }

    get state() {
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
                    return await fetchSubscriptions(this.engine);
                });
                if (!initialState) {
                    return;
                }
                if (this._destroyed) {
                    return;
                }

                // Apply state
                this._state = initialState;
                this.engine.persistence.subscriptions.setValue(this.engine.address, stateToPersistence(this._state));
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
        this._watched = watchSubscriptions(this.engine, async (newState) => {
            this._state = newState;
            this.engine.persistence.subscriptions.setValue(this.engine.address, stateToPersistence(this._state));
            this._eventEmitter.emit('updated');
        });
    }
}