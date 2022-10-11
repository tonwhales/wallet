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

        if (!data) {
            return null;
        }

        let cell = Cell.fromBoc(Buffer.from(data, 'base64'))[0];
        let parsed = parseTransaction(address.workChain, cell.beginParse());
        this.#raw.set(key, parsed);
        return parsed;
    }

    getHash(address: Address, lt: string | null) {
        if (!lt) {
            return null;
        }

        let data = this.engine.persistence.transactions.getValue({ address, lt: new BN(lt, 10) })!;

        if (!data) {
            return null;
        }

        let cell = Cell.fromBoc(Buffer.from(data, 'base64'))[0];

        return cell.hash();
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
        if (!t) {
            return null;
        }
        let parsed = parseWalletTransaction(t);
        this.#wallet.set(key, parsed);
        return parsed;
    }
}