import BN from "bn.js";
import { Address } from "@ton/core";
import { Engine } from "../Engine";

export type LiteAccount = {
    balance: bigint;
    last: { lt: bigint, hash: string } | null;
    block: number,
    storageStats: {
        lastPaid: number;
        duePayment: string | null;
        used: {
            bits: number;
            cells: number;
            publicCells: number;
        };
    } | null
}

export function startAccountLiteSync(address: Address, engine: Engine) {
    // let watcher = new AccountWatcher(address, engine)
    // let item = engine.persistence.liteAccounts.item(address);
    // watcher.on('account_changed', (account) => {
    //     item.update((src) => ({
    //         balance: account.state.balance,
    //         last: account.state.last ? { lt: BigInt(account.state.last.lt, 10), hash: account.state.last.hash } : null,
    //         block: account.state.seqno,
    //         storageStats: account.state.storageStats
    //     }));
    // });
}