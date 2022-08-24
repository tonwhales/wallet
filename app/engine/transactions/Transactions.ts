import { BN } from "bn.js";
import { Address, Cell, parseTransaction, RawTransaction } from "ton";
import { Engine } from "../Engine";
import { parseWalletTransaction } from "./parseWalletTransaction";
import { Transaction } from "../Transaction";

export class Transactions {
    readonly engine: Engine;
    #raw = new Map<string, RawTransaction>();
    #wallet = new Map<string, Transaction>();

    constructor(engine: Engine) {
        this.engine = engine;
    }

    get(address: Address, lt: string) {
        let key = address.toFriendly() + '::' + lt;
        let ex = this.#raw.get(key);
        if (ex) {
            return ex;
        }

        // Basic parsing
        let data = this.engine.persistence.transactions.getValue({ address, lt: new BN(lt, 10) })!;
        let cell = Cell.fromBoc(Buffer.from(data, 'base64'))[0];
        let parsed = parseTransaction(address.workChain, cell.beginParse());
        this.#raw.set(key, parsed);
        return parsed;
    }

    updatePersisted(address: Address, toSet: { lt: string, data: string }[], toRemove: string[]) {
        for (const t of toSet) {
            this.engine.persistence.transactions.setValue({ address, lt: new BN(t.lt, 10) }, t.data);
        }
        for (const r of toRemove) {
            this.engine.persistence.transactions.setValue({ address, lt: new BN(r, 10) }, null);
        }
    }

    set(address: Address, lt: string, data: string) {
        this.engine.persistence.transactions.setValue({ address, lt: new BN(lt, 10) }, data);
    }


    /**
     * Wallet Transaction
     */
    getWalletTransaction(address: Address, lt: string) {
        let key = address.toFriendly() + '::' + lt;
        let ex = this.#wallet.get(key);
        if (ex) {
            return ex;
        }

        let t = this.get(address, lt);
        let parsed = parseWalletTransaction(t);
        this.#wallet.set(key, parsed);
        return parsed;
    }
}