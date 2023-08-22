import BN from "bn.js";
import { Address, Cell, parseTransaction } from "ton";
import { Engine } from "../Engine";
import { backoff } from '../../../utils/time';
import { createLogger } from '../../../utils/log';
import { startDependentSync } from "./utils/startDependentSync";
import { parseWalletTransaction } from "../transactions/parseWalletTransaction";

export type FullAccount = {
    balance: BN;
    last: { lt: BN, hash: string } | null;
    block: number;

    transactionsCursor: { lt: BN, hash: string } | null;
    transactions: string[];
}
const logger = createLogger('account');
export function startAccountFullSync(address: Address, engine: Engine) {
    let key = `${address.toFriendly({ testOnly: engine.isTestnet })}/account/full`;
    let lite = engine.persistence.liteAccounts.item(address);
    let full = engine.persistence.fullAccounts.item(address);

    startDependentSync(key, lite, engine, async (liteAccount) => {
        let existing = full.value;

        // Check updated
        if (existing && existing.block >= liteAccount.block) {
            return;
        }

        // Check if not changed
        if (existing) {

            // If both are not null
            if (existing.last && liteAccount.last) {
                if (existing.last.lt.gte(new BN(liteAccount.last.lt))) {
                    // logger.log(`${address.toFriendly()}: Ignore since last is same`);
                    return;
                }
            }

            // If both null
            if ((!existing.last) && (!liteAccount.last)) {
                // logger.log(`${address.toFriendly()}: Ignore since last both empty`);
                return;
            }
        }

        // Load related transactions
        let transactions: string[] = [];
        let transactionsCursor: { lt: BN, hash: string } | null = null;

        // Load transactions if needed
        if (!!liteAccount.last) {

            // Download transactions
            let fetched = await backoff('account-full-sync', async () => {
                return await engine.client4.getAccountTransactions(address, liteAccount.last!.lt, Buffer.from(liteAccount.last!.hash, 'base64'));
            });

            let loadedTransactions = fetched.map((t) => {
                return {...parseTransaction(address.workChain, t.tx.beginParse()), data: t.tx.toBoc({ idx: false }).toString('base64')};
            })

            // Persist transactions
            for (let l of loadedTransactions) {
                const parsed = parseWalletTransaction(l, (Cell.fromBoc(Buffer.from(l.data, 'base64'))[0]).hash(), address, engine.isTestnet);
                engine.transactions.set(address, l.lt.toString(10), parsed);
            }

            // Transaction ids
            for (let l of loadedTransactions) {
                transactions.push(l.lt.toString(10));
            }

            // Read previous transaction
            if (loadedTransactions.length > 0) {
                let txData = Buffer.from(loadedTransactions[loadedTransactions.length - 1].data, 'base64');
                const lastTx = parseTransaction(0, Cell.fromBoc(txData)[0].beginParse());
                if (!lastTx.prevTransaction.lt.eq(new BN(0))) {
                    transactionsCursor = { lt: lastTx.prevTransaction.lt, hash: lastTx.prevTransaction.hash.toString('base64') };
                }
            }
        }

        // Check for holes
        if (existing) {

            // Try to merge transactions
            if (existing.last) {
                let combined: string[] = [];

                let lastLt = existing.last.lt.toString(10);
                let found = false;

                // Put all transactions until we reach last persisted
                for (let t of transactions) {
                    if (t === lastLt) {
                        found = true;
                        break;
                    }
                    combined.push(t);
                }

                // Put all persisted transactions
                if (found) {
                    for (let t of existing.transactions) {
                        combined.push(t);
                    }
                    // Get persisted transaction
                    transactionsCursor = existing.transactionsCursor;
                }

                // Use combined transactions
                transactions = combined;
            }
        }

        //
        // Persist
        //

        let newState: FullAccount = {
            balance: liteAccount.balance,
            last: liteAccount.last,
            block: liteAccount.block,
            transactionsCursor,
            transactions
        };
        full.update(() => newState);
    });
}