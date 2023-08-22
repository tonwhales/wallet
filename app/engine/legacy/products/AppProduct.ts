import * as React from 'react';
import { Cell } from "ton";
import { Engine } from "../Engine";
import { Job } from "../apps/Job";
import { parseJob } from "../apps/parseJob";
import EventEmitter from "events";
import { backoff } from '../../../utils/time';
import { getAppInstanceKeyPair } from '../../../storage/appState';
import { delay } from 'teslabot';
import axios from 'axios';
import { warn } from '../../../utils/log';

export class AppProduct {

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
            let job = engine.persistence.apps.getValue(engine.address);
            if (job) {
                let jobCell = Cell.fromBoc(Buffer.from(job, 'base64'))[0];
                let parsed = parseJob(jobCell.beginParse());
                if (parsed) {
                    this._state = { ...parsed, jobCell, jobRaw: job };
                }
            }
        } catch (e) {
            warn('Stored job error');
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

    async commitCommand(success: boolean, job: string, result: Cell) {
        if (this._completed.has(job)) {
            return false;
        }
        this._completed.add(job);
        if (this._state && this._state.jobRaw === job) {
            this._state = null;
            this.engine.persistence.apps.setValue(this.engine.address, null);
            this._eventEmitter.emit('updated');
        }

        // Notify
        await backoff('app', async () => {
            await axios.post('https://connect.tonhubapi.com/connect/command/commit', {
                successful: success,
                job,
                result: result.toBoc({ idx: false }).toString('base64')
            });
        });
        return true;
    }

    async fetchJob() {

        let keypair = await getAppInstanceKeyPair();
        let key = keypair.publicKey.toString('base64').replace(/\//g, '_')
            .replace(/\+/g, '-')
            .replace(/\=/g, '');
        let res = await axios.get('https://connect.tonhubapi.com/connect/command/' + key);

        if (res.data.state === 'submitted') {
            let jobCell = Cell.fromBoc(Buffer.from(res.data.job, 'base64'))[0];
            if (this._state && this._state.jobCell.equals(jobCell) || this._completed.has(res.data.job)) {
                return null;
            }
            let parsed = parseJob(jobCell.beginParse());
            if (!parsed) {
                return null;
            }
            if (parsed) {
                return { job: parsed, raw: res.data.job as string };
            }
        }
        return null;
    }

    private _startSync() {
        backoff('app', async () => {
            while (!this._destroyed) {
                let keypair = await getAppInstanceKeyPair();
                let key = keypair.publicKey.toString('base64').replace(/\//g, '_')
                    .replace(/\+/g, '-')
                    .replace(/\=/g, '');
                let res = await axios.get('https://connect.tonhubapi.com/connect/command/' + key);

                // Empty state
                if (res.data.state === 'empty' || res.data.state === 'expired' || res.data.state === 'completed' || res.data === 'rejected') {
                    if (this._state) {
                        this._state = null;
                        this.engine.persistence.apps.setValue(this.engine.address, null);
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
                        this.engine.persistence.apps.setValue(this.engine.address, null);
                        this._eventEmitter.emit('updated');
                        continue;
                    }
                    if (parsed) {
                        this._state = { ...parsed, jobCell, jobRaw: res.data.job };
                        this.engine.persistence.apps.setValue(this.engine.address, res.data.job);
                        this._eventEmitter.emit('updated');
                        continue;
                    }
                }

                await delay(3000);
            }
        });
    }
}