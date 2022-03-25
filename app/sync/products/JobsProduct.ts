import * as React from 'react';
import { Cell } from "ton";
import { Engine } from "../Engine";
import { Job } from "../parse/Job";
import { parseJob } from "../parse/parseJob";
import EventEmitter from "events";
import { backoff } from '../../utils/time';
import { getAppInstanceKeyPair } from '../../storage/appState';
import { delay } from 'teslabot';
import axios from 'axios';

export class JobsProduct {

    readonly engine: Engine;
    private _destroyed: boolean;
    private _state: {
        expires: number;
        key: Buffer;
        appPublicKey: Buffer;
        job: Job;
        jobCell: Cell;
        jobRaw: string;
    } | null = null
    private _eventEmitter: EventEmitter = new EventEmitter();
    private _completed = new Set<string>();

    constructor(engine: Engine) {
        this.engine = engine;
        this._destroyed = false;
        try {
            let job = engine.cache.loadJob(engine.address);
            if (job) {
                let jobCell = Cell.fromBoc(Buffer.from(job, 'base64'))[0];
                let parsed = parseJob(jobCell.beginParse());
                if (parsed) {
                    this._state = { ...parsed, jobCell, jobRaw: job };
                }
            }
        } catch (e) {
            console.warn('Stored job error');
        }
        this._startSync();
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

    async awaitReady() {
        // Nothing to do
    }

    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
        }
    }

    commitCommand(success: boolean, job: string, result: Cell) {
        if (this._completed.has(job)) {
            return;
        }
        this._completed.add(job);
        if (this._state && this._state.jobRaw === job) {
            this._state = null;
            this.engine.cache.storeJob(this.engine.address, null);
            this._eventEmitter.emit('updated');
        }

        // Notify
        backoff(async () => {
            await axios.post('https://connect.tonhubapi.com/connect/command/commit', {
                successful: success,
                job,
                result: result.toBoc({ idx: false }).toString('base64')
            });
        });
    }

    private _startSync() {
        backoff(async () => {
            while (!this._destroyed) {
                let keypair = await getAppInstanceKeyPair();
                let key = keypair.publicKey.toString('base64').replaceAll('/', '_')
                    .replaceAll('+', '-')
                    .replaceAll('=', '');
                let res = await axios.get('https://connect.tonhubapi.com/connect/command/' + key);

                // Empty state
                if (res.data.state === 'empty' || res.data.state === 'expired' || res.data.state === 'completed' || res.data === 'rejected') {
                    if (this._state) {
                        this._state = null;
                        this.engine.cache.storeJob(this.engine.address, null);
                        this._eventEmitter.emit('updated');
                    }
                    continue;
                }

                // Submited state
                if (res.data.state === 'submitted') {
                    let jobCell = Cell.fromBoc(Buffer.from(res.data.job, 'base64'))[0];
                    if (this._state && this._state.jobCell.equals(jobCell) || this._completed.has(res.data.job)) {
                        continue;
                    }
                    let parsed = parseJob(jobCell.beginParse());
                    if (!parsed && !!this._state) {
                        this._state = null;
                        this.engine.cache.storeJob(this.engine.address, null);
                        this._eventEmitter.emit('updated');
                        continue;
                    }
                    if (parsed) {
                        this._state = { ...parsed, jobCell, jobRaw: res.data.job };
                        this.engine.cache.storeJob(this.engine.address, res.data.job);
                        this._eventEmitter.emit('updated');
                        continue;
                    }
                }

                await delay(3000);
            }
        });
    }
}