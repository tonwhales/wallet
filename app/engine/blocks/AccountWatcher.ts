import BN from "bn.js";
import EventEmitter from "events";
import { SyncValue } from "teslabot";
import { Address } from "ton";
import { createLogger } from "../../utils/log";
import { Engine } from "../Engine";

export type AccountState = {
    balance: BN;
    last: { lt: string, hash: string } | null;
    seqno: number;
    state: {
        type: 'uninit';
    } | {
        type: 'active';
        codeHash: string;
        dataHash: string;
    } | {
        type: 'frozen';
        stateHash: string;
    };
}

export interface AccountWatcher {
    emit(event: 'account_changed', data: { address: Address, state: AccountState }): boolean
    on(event: 'account_changed', listener: (data: { address: Address, state: AccountState }) => void): this
    once(event: 'account_changed', listener: (data: { address: Address, state: AccountState }) => void): this
}

const logger = createLogger('watcher');

export class AccountWatcher extends EventEmitter {
    readonly address: Address;
    readonly engine: Engine;
    #state: AccountState | null = null;
    #maxKnownSeqno: number | null = null;
    #sync: SyncValue<number>;
    #syncLock: (() => void) | null = null;

    constructor(address: Address, engine: Engine) {
        super();
        this.address = address;
        this.engine = engine;
        this.#syncLock = engine.state.beginUpdating();
        let key = address.toFriendly();

        // Create account sync
        this.#sync = new SyncValue(0, async (v) => {
            if (v <= 0) {
                if (this.#syncLock) {
                    this.#syncLock();
                    this.#syncLock = null;
                }
                // log(`[${key}]: Awaiting last known block`);
                return;
            }
            if (this.#state && this.#state.seqno >= v) {
                if (this.#syncLock) {
                    this.#syncLock();
                    this.#syncLock = null;
                }
                // log(`[${key}]: Already loaded state for #${v}`);
                return;
            }

            // Check if changed
            if (this.#state && this.#state.last) {
                logger.log(`${key}: Check if state changed #` + v);
                let changed = await engine.client4.isAccountChanged(v, address, new BN(this.#state.last.lt, 10));
                if (!changed.changed) {
                    logger.log(`${key}: State not changed #` + v);
                    if (this.#syncLock) {
                        this.#syncLock();
                        this.#syncLock = null;
                    }
                    return;
                }
            }

            // Downloading fresh state
            let start = Date.now();
            logger.log(`${key}: Downloading new state at #` + v);
            let state = await engine.client4.getAccountLite(v, address);
            this.#state = {
                balance: new BN(state.account.balance.coins, 10),
                last: state.account.last,
                seqno: v,
                state: state.account.state
            };
            logger.log(`${key}: State downloaded in ${Date.now() - start} ms`);
            this.emit('account_changed', { address, state: this.#state });

            // Release lock
            if (this.#syncLock) {
                this.#syncLock();
                this.#syncLock = null;
            }
        });
        if (this.engine.blocksWatcher.cursor) {
            this.#sync.value = this.engine.blocksWatcher.cursor.current.seqno;
        } else {
            this.#sync.value = -1;
        }

        // Handle block updates
        this.engine.blocksWatcher.on('new_session', (ref) => {
            let lock = engine.state.beginUpdating();
            if (this.#syncLock) {
                this.#syncLock();
            }
            this.#syncLock = lock;

            this.#maxKnownSeqno = Math.max(this.#maxKnownSeqno || ref.seqno, ref.seqno);
            this.#sync.value = this.#maxKnownSeqno;
        });
        this.engine.blocksWatcher.on('block', (block) => {
            if (block.changed[key]) {
                this.#maxKnownSeqno = Math.max(this.#maxKnownSeqno || block.seqno, block.seqno);
                this.#sync.value = this.#maxKnownSeqno;
            }
        });
    }

    get state() {
        return this.#state;
    }
}