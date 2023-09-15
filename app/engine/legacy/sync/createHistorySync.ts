import BN from "bn.js";
import { SyncValue } from "teslabot";
import { Address, Cell, parseTransaction } from "@ton/core";
import { createLogger } from "../../../utils/log";
import { backoff } from "../../../utils/time";
import { Engine } from "../Engine";
import { parseWalletTransaction } from "../transactions/parseWalletTransaction";
import { FullAccount } from "./startAccountFullSync";

export function createHistorySync(address: Address, engine: Engine) {

    const item = engine.persistence.fullAccounts.item(address);
    const logger = createLogger('history');

    const sync = new SyncValue<{ lt: string, hash: string } | null>(null, async (cursor) => {

        //
        // Pre flight checks
        //

        if (!cursor) {
            return;
        }
        let itm = item.value;
        if (!itm) {
            return;
        }
        let ex = engine.transactions.get(address, itm.transactions[itm.transactions.length - 1]);
        if (!ex || !ex.prev) {
            return;
        }
        if (cursor.lt !== ex.prev.lt) {
            return;
        }

        //
        // Loading transactions
        //
        logger.log('Loading older transactions from ' + cursor.lt);
        let fetched = await backoff('account-history', async () => {
            return await engine.client4.getAccountTransactions(address, BigInt(cursor.lt, 10), Buffer.from(cursor.hash, 'base64'));
        });

        let loadedTransactions: string[] = [];
        // Download introspection
        for (let t of fetched) {
            const tx = parseTransaction(address.workChain, t.tx.beginParse());
            const data = t.tx.toBoc({ idx: false }).toString('base64');

            // Add to loaded transactions
            loadedTransactions.push(tx.lt.toString(10));

            // Persist transaction
            const parsed = parseWalletTransaction(tx, Cell.fromBoc(Buffer.from(data, 'base64'))[0].hash(), address, engine.isTestnet);
            engine.transactions.set(address, tx.lt.toString(10), parsed);
        }

        // Read previous transaction
        let nextCuror: { lt: bigint, hash: string } | null = null;
        if (loadedTransactions.length > 0) {
            const lastTx = parseTransaction(address.workChain, fetched[loadedTransactions.length - 1].tx.beginParse());
            if (!lastTx.prevTransaction.lt.eq(BigInt(0))) {
                nextCuror = { lt: lastTx.prevTransaction.lt, hash: lastTx.prevTransaction.hash.toString('base64') };
            }
        }

        // Apply history
        logger.log(`${address.toString({ testOnly: engine.isTestnet })}: Apply history state`);
        item.update((src) => {
            if (!src) {
                throw Error('Internal error');
            }
            if (!src.transactionsCursor || src.transactionsCursor.hash !== cursor.hash && cursor.lt !== src.transactionsCursor.lt.toString(10)) {
                throw Error('Transactions cursor changed');
            }

            // Add transaction ids
            let transactions: string[] = [...src.transactions, ...loadedTransactions];

            let newState: FullAccount = {
                ...src,
                transactions,
                transactionsCursor: nextCuror
            };
            return newState;
        });
    });

    return {
        loadMore: (lt: string, hash: string) => {
            let itm = item.value;
            if (itm && itm.transactions.length > 0) {
                let ex = engine.transactions.get(address, itm.transactions[itm.transactions.length - 1]);
                if (!ex || !ex.prev) {
                    logger.warn('Reached end');
                    return;
                }
                if (lt !== ex.prev.lt) {
                    logger.warn('Incorrect LT');
                    return;
                }

                if (!sync.value || sync.value.lt !== lt) {
                    sync.value = { lt, hash };
                }
            }
        }
    }
}