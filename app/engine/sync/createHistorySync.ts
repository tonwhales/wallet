import BN from "bn.js";
import { SyncValue } from "teslabot";
import { Address, Cell, parseTransaction } from "ton";
import { AppConfig } from "../../AppConfig";
import { createLogger } from "../../utils/log";
import { backoff } from "../../utils/time";
import { Engine } from "../Engine";
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
        if (!ex || !ex.prevTransaction) {
            return;
        }
        if (cursor.lt !== ex.prevTransaction.lt.toString(10)) {
            return;
        }

        //
        // Loading transactions
        //
        logger.log('Loading older transactions from ' + cursor.lt);
        let fetched = await backoff('account-history', async () => {
            return await engine.client4.getAccountTransactions(address, new BN(cursor.lt, 10), Buffer.from(cursor.hash, 'base64'));
        });

        // Download introspection
        let mentioned = new Set<string>();
        for (let t of fetched) {
            let tx = parseTransaction(0, t.tx.beginParse());
            if (tx.inMessage && tx.inMessage.info.src && Address.isAddress(tx.inMessage.info.src)) {
                mentioned.add(tx.inMessage.info.src.toFriendly({ testOnly: AppConfig.isTestnet }));
            }
            for (let out of tx.outMessages) {
                if (out.info.dest && Address.isAddress(out.info.dest)) {
                    mentioned.add(out.info.dest.toFriendly({ testOnly: AppConfig.isTestnet }));
                }
            }
        }

        let loadedTransactions = fetched.map((t) => {
            return {...parseTransaction(address.workChain, t.tx.beginParse()), data: t.tx.toBoc({ idx: false }).toString('base64')};
        })

        // Persist transactions
        for (let l of loadedTransactions) {
            engine.transactions.set(address, l.lt.toString(10), l.data);
        }

        // Read previous transaction
        let nextCuror: { lt: BN, hash: string } | null = null;
        if (loadedTransactions.length > 0) {
            let txData = Buffer.from(loadedTransactions[loadedTransactions.length - 1].data, 'base64');
            const lastTx = parseTransaction(0, Cell.fromBoc(txData)[0].beginParse());
            if (!lastTx.prevTransaction.lt.eq(new BN(0))) {
                nextCuror = { lt: lastTx.prevTransaction.lt, hash: lastTx.prevTransaction.hash.toString('base64') };
            }
        }

        // Apply history
        logger.log(`${address.toFriendly({ testOnly: AppConfig.isTestnet })}: Apply history state`);
        item.update((src) => {
            if (!src) {
                throw Error('Internal error');
            }
            if (!src.transactionsCursor || src.transactionsCursor.hash !== cursor.hash && cursor.lt !== src.transactionsCursor.lt.toString(10)) {
                throw Error('Transactions cursor changed');
            }

            // Add transaction ids
            let transactions: string[] = [...src.transactions];
            for (let l of loadedTransactions) {
                transactions.push(l.lt.toString(10));
            }

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
                if (!ex || !ex.prevTransaction) {
                    logger.warn('Reached end');
                    return;
                }
                if (lt !== ex.prevTransaction.lt.toString(10)) {
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