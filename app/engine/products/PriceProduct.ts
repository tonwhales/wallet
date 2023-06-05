import { Engine } from "../Engine";
import EventEmitter from "events";
import { backoff } from "../../utils/time";
import React from "react";
import { fetchPrice } from "../api/fetchPrice";
import { watchPrice } from "../api/watchPrice";
import { useRecoilValue } from "recoil";
import { CloudValue } from "../cloud/CloudValue";
import { ProductWithSync } from "./ProductWithSync";

export const PrimaryCurrency: { [key: string]: string } = {
    Usd: 'USD',
    Eur: 'EUR',
    Rub: 'RUB',
    Gbp: 'GBP',
    Chf: 'CHF',
    Cny: 'CNY',
    Krw: 'KRW',
    Idr: 'IDR',
    Inr: 'INR',
    Jpy: 'JPY',
}

export const CurrencySymbols: { [key: string]: { symbol: string, end?: boolean } } = {
    [PrimaryCurrency.Usd]: { symbol: '$' },
    [PrimaryCurrency.Eur]: { symbol: '€' },
    [PrimaryCurrency.Rub]: { symbol: '₽', end: true },
    [PrimaryCurrency.Gbp]: { symbol: '£' },
    [PrimaryCurrency.Chf]: { symbol: '₣' },
    [PrimaryCurrency.Cny]: { symbol: '¥' },
    [PrimaryCurrency.Krw]: { symbol: '₩' },
    [PrimaryCurrency.Idr]: { symbol: 'Rp', end: true },
    [PrimaryCurrency.Inr]: { symbol: '₹' },
    [PrimaryCurrency.Jpy]: { symbol: '¥' },
};

export type PriceState = {
    price: {
        usd: number,
        rates: { [key: string]: number }
    }
}

const version = 1;

export class PriceProduct implements ProductWithSync {
    readonly engine: Engine;
    private _state: PriceState | null = null;
    private _eventEmitter: EventEmitter = new EventEmitter();
    private _destroyed: boolean;
    private _watched: (() => void) | null = null;
    readonly primaryCurrency: CloudValue<{ currency: string }>

    constructor(engine: Engine) {
        this.engine = engine;
        this.primaryCurrency = this.engine.cloud.get(`primaryCurrency-v${version}`, (src) => { src.currency = PrimaryCurrency.Usd });
        this._state = engine.persistence.prices.getValue();
        this._destroyed = false;
    }

    get ready() {
        return !!this._state;
    }

    get state() {
        if (!this._state) {
            throw Error('PriceProduct not ready');
        }
        return this._state;
    }

    usePrimaryCurrency() {
        return useRecoilValue(this.primaryCurrency.atom).currency;
    }

    setPrimaryCurrency(code: string) {
        this.primaryCurrency.update((src) => {
            src.currency = code;
        });
    }

    useState() {
        const [state, setState] = React.useState(this._state);
        React.useEffect(() => {

            let ended = false;

            // Just in case of race conditions
            if (state !== this._state) {
                setState(this._state);
            }

            // Update handler
            const handler = () => {
                if (ended) {
                    return;
                }
                setState(this._state);
            }

            this._eventEmitter.on('updated', handler);
            this._eventEmitter.on('ready', handler);
            return () => {
                ended = true;
                this._eventEmitter.off('updated', handler);
                this._eventEmitter.off('ready', handler);
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
            backoff('price', async () => {

                // Fetch initial state
                const initialState = await backoff('price', async () => {
                    if (this._destroyed) {
                        return null;
                    }
                    return await fetchPrice();
                });
                if (!initialState) {
                    return;
                }
                if (this._destroyed) {
                    return;
                }

                // Apply state
                this._state = initialState;
                this.engine.persistence.prices.setValue(undefined, this._state);
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
        this._watched = watchPrice(async (newState) => {
            this._state = newState;
            this.engine.persistence.prices.setValue(undefined, this._state!);
            this._eventEmitter.emit('updated');
        });
    }

    startSync() {
        this._start();
    }

    stopSync() {
        this.destroy();
    }
}