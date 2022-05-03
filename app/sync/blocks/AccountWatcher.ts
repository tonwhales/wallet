import BN from "bn.js";
import EventEmitter from "events";
import { SyncValue } from "teslabot";
import { Address } from "ton";
import { Engine } from "../Engine";

export type AccountState = {
    balance: BN;
    last: { lt: string, hash: string } | null;
    seqno: number;
}

export interface AccountWatcher {
    emit(event: 'account_changed', data: { address: Address, state: AccountState }): boolean
    on(event: 'account_changed', listener: (data: { address: Address, state: AccountState }) => void): this
    once(event: 'account_changed', listener: (data: { address: Address, state: AccountState }) => void): this
}

export class AccountWatcher extends EventEmitter {
    readonly address: Address;
    readonly engine: Engine;
    #state: AccountState | null = null;
    #maxKnownSeqno: number | null = null;
    #sync: SyncValue<number>;

    constructor(address: Address, engine: Engine) {
        super();
        this.address = address;
        this.engine = engine;
        let key = address.toFriendly();

        // Create account sync
        this.#sync = new SyncValue(0, async (v) => {
            if (v <= 0) {
                console.log(`[${key}]: Awaiting last known block`);
                return;
            }
            if (this.#state && this.#state.seqno >= v) {
                console.log(`[${key}]: Already loaded state for #${v}`);
                return;
            }
            console.log(`[${key}]: Downloading new state at #` + v);
            let state = await engine.client4.getAccount(v, address);
            this.#state = {
                balance: new BN(state.account.balance.coins, 10),
                last: state.account.last,
                seqno: v
            };
            console.log(`[${key}]: State downloaded`);
            this.emit('account_changed', { address, state: this.#state });
        });
        if (this.engine.blocksWatcher.cursor) {
            this.#sync.value = this.engine.blocksWatcher.cursor.current.seqno;
        } else {
            this.#sync.value = -1;
        }

        // Handle block updates
        this.engine.blocksWatcher.on('new_session', (ref) => {
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