import BN from "bn.js";
import { Address, Cell, parseTransaction } from "ton";
import { Engine } from "../Engine";
import { backoff } from '../../utils/time';
import { AppConfig } from '../../AppConfig';
import { log } from '../../utils/log';
import { AccountLiteAtom } from './AccountLiteAtom';
import { InvalidateSync } from "../utils/InvalidateSync";
import { ConnectorTransaction } from "../api/Connector";
import { ReactSync } from "../utils/ReactSync";
import { createEngineSync } from "../utils/createEngineSync";
import { PersistedItem } from "../persistence/PersistedItem";

export type FullAccount = {
    balance: BN;
    last: { lt: BN, hash: string } | null;
    block: number;

    transactionsCursor: { lt: BN, hash: string } | null;
    transactions: string[];
}

export class AccountFullSync {

    readonly engine: Engine;
    readonly parent: AccountLiteAtom;
    readonly address: Address;
    readonly ref: ReactSync<FullAccount> = new ReactSync();
    #item: PersistedItem<FullAccount>;
    #primarySync: InvalidateSync;
    #loadMoreSync: InvalidateSync;

    private loadMoreCursor: { lt: string, hash: string } | null = null;


    constructor(parent: AccountLiteAtom) {

        // Refs
        this.#item = parent.engine.model.accountFull(parent.address);
        this.engine = parent.engine;
        this.address = parent.address;
        this.parent = parent;

        // Sync
        this.#primarySync = createEngineSync(`account-full(${parent.address.toFriendly({ testOnly: AppConfig.isTestnet })})`, parent.engine, async () => {
            await this.doPrimarySync();
        });

        this.#loadMoreSync = new InvalidateSync(`account-full(${parent.address.toFriendly({ testOnly: AppConfig.isTestnet })}):load-more`, async () => {
            if (this.loadMoreCursor) {
                await this.doHistorySync(this.loadMoreCursor);
            }
        });

        // Forward value
        if (this.#item.value) {
            this.ref.value = this.#item.value;
        }

        // Forward parent
        if (parent.ready) {
            this.#primarySync.invalidate();
        }
        parent.ref.on('ready', () => {
            this.#primarySync.invalidate();
        });
        parent.ref.on('updated', () => {
            this.#primarySync.invalidate();
        });
    }

    get ready() {
        return this.ref.ready;
    }

    get current() {
        return this.#item.value;
    }

    loadMore = (cursor: { lt: string, hash: string }) => {
        let current = this.#item.value;
        if (current && current.transactionsCursor && (current.transactionsCursor.hash === cursor.hash) && (current.transactionsCursor.lt.toString(10) === cursor.lt)) {
            this.loadMoreCursor = cursor;
            this.#loadMoreSync.invalidate();
        }
    }

    protected doPrimarySync = async (): Promise<void> => {

        // Existing
        let existing = this.#item.value;

        // Load lite account state
        const liteAccount = this.parent.current;
        if (!liteAccount) {
            return;
        }

        // Check updated
        if (existing && existing.block >= liteAccount.block) {
            return;
        }

        // Check if not changed
        if (existing) {

            // If both are not null
            if (existing.last && liteAccount.last) {
                if (existing.last.lt.gte(new BN(liteAccount.last.lt))) {
                    log(`[${this.address.toFriendly()}]: Ignore since last is same`);
                    return;
                }
            }

            // If both null
            if ((!existing.last) && (!liteAccount.last)) {
                log(`[${this.address.toFriendly()}]: Ignore since last both empty`);
                return;
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

            // Prepare transactions
            await this.prepareTransactions(liteAccount.block, loadedTransactions);

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
        this.#item.update(() => newState);
        this.ref.value = newState;
    }

    protected doHistorySync = async (cursor: { lt: string, hash: string }) => {

        // Fetch current
        let src = this.#item.value;
        if (!src) {
            return;
        }

        // Loading next
        if (src.transactionsCursor && src.transactionsCursor.hash === cursor.hash && cursor.lt === src.transactionsCursor.lt.toString(10)) {
            log(`[${this.address.toFriendly()}]: Loading more transactions after ${cursor.lt}`);

            // Loading transactions
            let loadedTransactions = await backoff('account-full-sync', async () => {
                return await this.engine.connector.fetchTransactions(this.address, { lt: cursor.lt, hash: cursor.hash });
            });
            loadedTransactions = loadedTransactions.slice(1); // Remove first

            log(`[${this.address.toFriendly()}]: Transactions downloaded`);

            // Prepare
            await this.prepareTransactions(src.block, loadedTransactions);

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

            // Persist transactions
            for (let l of loadedTransactions) {
                this.engine.transactions.set(this.address, l.id.lt, l.data);
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

            // Apply transactions
            let cr = this.#item.value!;
            if (!cr.transactionsCursor || cr.transactionsCursor.hash !== cursor.hash && cursor.lt !== cr.transactionsCursor.lt.toString(10)) {
                throw Error('Transactions cursor changed');
            }

            // Transaction ids
            let transactions: string[] = [...cr.transactions];
            for (let l of loadedTransactions) {
                transactions.push(l.id.lt);
            }

            // Update
            log(`[${this.address.toFriendly()}]: Apply new state`);
            let newState: FullAccount = {
                ...cr,
                transactions,
                last: nextCuror
            };
            this.#item.update(() => newState);
            this.ref.value = newState;

        } else {
            log(`[${this.address.toFriendly()}]: Loading more transactions ignored because of lt mismatch`);
        }
    }

    private prepareTransactions = async (block: number, loadedTransactions: ConnectorTransaction[]) => {

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
        await Promise.all(Array.from(mentioned).map((src) => backoff('account-full-sync', () => this.engine.metadata.prepareMetadata(block, Address.parse(src)))));

        // Persist transactions
        for (let l of loadedTransactions) {
            this.engine.transactions.set(this.address, l.id.lt, l.data);
        }
    }
}