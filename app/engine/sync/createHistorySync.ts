import { SyncValue } from "teslabot";
import { Address, Cell, parseTransaction } from "ton";
import { AppConfig } from "../../AppConfig";
import { createLogger } from "../../utils/log";
import { backoff } from "../../utils/time";
import { Engine } from "../Engine";

export function createHistorySync(address: Address, engine: Engine) {

    const transactionsItem = engine.transactions.item(address);
    const logger = createLogger('history');

    const sync = new SyncValue<{ lt: string, hash: string } | null>(null, async (cursor) => {

        //
        // Pre flight checks
        //

        if (!cursor) {
            return;
        }
        let transactionsValue = transactionsItem.value;
        if (!transactionsValue) {
            return;
        }
        let ex = engine.transactions.get(address, transactionsValue[transactionsValue.length - 1]);
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
        let loadedTransactions = await backoff('account-history', async () => {
            return await engine.connector.fetchTransactions(address, cursor);
        });

        // Download introspection
        let mentioned = new Set<string>();
        for (let t of loadedTransactions) {
            let txData = Buffer.from(t.data, 'base64');
            let tx = parseTransaction(0, Cell.fromBoc(txData)[0].beginParse());
            if (tx.inMessage && tx.inMessage.info.src) {
                mentioned.add(tx.inMessage.info.src.toFriendly({ testOnly: AppConfig.isTestnet }));
            }
            for (let out of tx.outMessages) {
                if (out.info.dest) {
                    mentioned.add(out.info.dest.toFriendly({ testOnly: AppConfig.isTestnet }));
                }
            }
        }

        for (let l of loadedTransactions) {
            engine.transactions.set(address, l.id.lt, l.data);
        }

        transactionsItem.update((prev) => {
            return [...(prev || []), ...loadedTransactions.map((l) => l.id.lt)]
        });
    });

    return {
        loadMore: (lt: string, hash: string) => {
            let txsValue = transactionsItem.value;
            if (txsValue && txsValue.length > 0) {
                let ex = engine.transactions.get(address, txsValue[txsValue.length - 1]);
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