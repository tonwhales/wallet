import { Engine } from "../Engine";
import EventEmitter from "events";
import { backoff } from "../../utils/time";
import React from "react";
import { watchSubscriptions } from "../watchSubscriptions";
import { fetchSubscriptions, SubscriptionsStateData } from "../fetchSubscriptions";

export class SubscriptionsProduct {
    readonly engine: Engine;
    private _state: SubscriptionsStateData | null = null;
    private _eventEmitter: EventEmitter = new EventEmitter();
    private _destroyed: boolean;
    private _watched: (() => void) | null = null;

    constructor(engine: Engine) {
        this.engine = engine;
        this._state = engine.cache.loadSubscriptions();
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
                    return await fetchSubscriptions();
                });
                if (!initialState) {
                    return;
                }
                if (this._destroyed) {
                    return;
                }

                // Apply state
                this._state = initialState;
                this.engine.cache.storeSubscriptions(this._state);
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
        this._watched = watchSubscriptions(async (newState) => {
            this._state = newState;
            this.engine.cache.storeSubscriptions(this._state);
            this._eventEmitter.emit('updated');
        });
    }
}