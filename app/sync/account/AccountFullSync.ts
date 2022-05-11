import BN from "bn.js";
import { Address, Cell, parseTransaction } from "ton";
import { Engine } from "../Engine";
import { backoff } from '../../utils/time';
import { AppConfig } from '../../AppConfig';
import { log } from '../../utils/log';
import { PersistedValueSync } from '../utils/PersistedValueSync';
import { AccountLiteSync } from './AccountLiteSync';

export type FullAccount = {
    balance: BN;
    last: { lt: BN, hash: string } | null;
    block: number;

    transactionsCursor: { lt: BN, hash: string } | null;
    transactions: string[];
}

export class AccountFullSync extends PersistedValueSync<FullAccount> {

    readonly engine: Engine;
    readonly parent: AccountLiteSync;
    readonly address: Address;

    constructor(parent: AccountLiteSync) {
        super(`account-full(${parent.address.toFriendly({ testOnly: AppConfig.isTestnet })})`, parent.engine.persistence.fullAccounts.item(parent.address), parent.engine);

        this.engine = parent.engine;
        this.address = parent.address;
        this.parent = parent;

        // Forward parent
        if (parent.ready) {
            this.invalidate();
        }
        parent.ref.on('ready', () => {
            this.invalidate();
        });
        parent.ref.on('updated', () => {
            this.invalidate();
        });
    }

    protected doSync = async (existing: FullAccount | null): Promise<FullAccount | null> => {

        // Load lite account state
        const liteAccount = this.parent.current;
        if (!liteAccount) {
            return null;
        }

        // Check updated
        if (existing && existing.block >= liteAccount.block) {
            return null;
        }

        // Check if not changed
        if (existing) {

            // If both are not null
            if (existing.last && liteAccount.last) {
                if (existing.last.lt.gte(new BN(liteAccount.last.lt))) {
                    log(`[${this.address.toFriendly()}]: Ignore since last is same`);
                    return null;
                }
            }

            // If both null
            if ((!existing.last) && (!liteAccount.last)) {
                log(`[${this.address.toFriendly()}]: Ignore since last both empty`);
                return null;
            }
        }

        // Load related transactions
        let transactions: string[] = [];
        let transactionsCursor: { lt: BN, hash: string } | null = null;

        // Load transactions if needed
        if (!!liteAccount.last) {

            // Download transactions
            let loadedTransactions = await backoff('account-full-sync', async () => {
                return await this.engine.connector.fetchTransactions(this.address, { lt: liteAccount.last!.lt.toString(10), hash: liteAccount.last!.hash });
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

            // Prepare metadata
            await Promise.all(Array.from(mentioned).map((src) => backoff('account-full-sync', () => this.engine.metadata.prepareMetadata(liteAccount.block, Address.parse(src)))));

            // Persist transactions
            for (let l of loadedTransactions) {
                this.engine.transactions.set(this.address, l.id.lt, l.data);
            }

            // Transaction ids
            for (let l of loadedTransactions) {
                transactions.push(l.id.lt);
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

        return {
            balance: liteAccount.balance,
            last: liteAccount.last,
            block: liteAccount.block,
            transactionsCursor,
            transactions
        };
    }
}