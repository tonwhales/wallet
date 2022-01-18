import BN from "bn.js";
import { Address } from "ton";
import React from 'react';
import { storage } from "../storage/storage";
import { fetchAccountState, fetchAccountTransactions, SimpleTransaction } from "../client";
import { backoff } from "../utils/time";
import { delay } from "teslabot";

function padLt(src: string) {
    let res = src;
    while (res.length < 20) {
        res = '0' + res;
    }
    return res;
}

export type AccountStatus = {

    // State
    balance: BN,
    state: 'active' | 'uninitialized' | 'frozen',
    lastTransaction: { lt: string, hash: string } | null,
    syncTime: number,
    storedAt: number,

    // Transactions
    loadedTransactions: number,
    transactionCursor: { lt: string, hash: string } | null,
    transactions: string[]
};

function serializeStatus(src: AccountStatus) {
    return JSON.stringify({
        ...src,
        balance: src.balance.toString(10),
    })
}

function parseStatus(src: string): AccountStatus {
    let d = JSON.parse(src);
    return {
        ...d,
        balance: new BN(d.balance, 10)
    }
}

async function getAccountStatusInitial(address: Address): Promise<{ txs: SimpleTransaction[], status: AccountStatus }> {
    let res = await backoff(() => fetchAccountState(address));
    let txs: SimpleTransaction[] = [];
    if (res.lastTransaction) {
        txs = await fetchAccountTransactions(address, 100, res.lastTransaction);
    }
    return {
        txs,
        status: {
            balance: res.balance,
            state: res.state,
            lastTransaction: res.lastTransaction,
            syncTime: res.timestamp,
            storedAt: Date.now(),
            transactionCursor: txs.length < 100 ? null : txs[txs.length - 1].id,
            loadedTransactions: txs.length,
            transactions: txs.map((v) => v.id.lt)
        }
    };
}

async function getAccountStatusUpdate(address: Address, currentStatus: AccountStatus): Promise<{ txs: SimpleTransaction[], status: AccountStatus }> {
    let res = await backoff(() => fetchAccountState(address));
    let changed = false;
    if (!res.balance.eq(currentStatus.balance)) {
        changed = true;
    }
    if (res.state !== currentStatus.state) {
        changed = true;
    }
    if (res.lastTransaction === null && currentStatus.lastTransaction !== null) {
        changed = true;
    }
    if (res.lastTransaction !== null && currentStatus.lastTransaction === null) {
        changed = true;
    }
    if (res.lastTransaction !== null && currentStatus.lastTransaction !== null && (res.lastTransaction.lt !== currentStatus.lastTransaction.lt)) {
        changed = true;
    }
    if (!changed) {
        return {
            txs: [],
            status: {
                ...currentStatus,
                storedAt: Date.now()
            }
        };
    } else {

        let txs: SimpleTransaction[] = [];
        let transactionCursor: { lt: string, hash: string } | null = null;
        let loadedTransactions: number = currentStatus.loadedTransactions;
        let transactions: string[] = currentStatus.transactions;

        // Got first transaction: reset to zero
        if (res.lastTransaction && !currentStatus.lastTransaction) {
            txs = await fetchAccountTransactions(address, 100, res.lastTransaction);
            if (txs.length < 100) {
                transactionCursor = txs[txs.length - 1].id;
            } else {
                transactionCursor = null;
            }
            loadedTransactions = txs.length;
            transactions = txs.map((v) => v.id.lt);
        }

        // Lost last transaction: got frozen?
        if (!res.lastTransaction && !!currentStatus.lastTransaction) {
            txs = [];
            transactions = [];
            transactionCursor = null;
            loadedTransactions = 0;
        }

        // Updated transactions
        if (!!res.lastTransaction && !!currentStatus.lastTransaction && (res.lastTransaction.lt !== currentStatus.lastTransaction.lt)) {
            let found = false;

            let ttxs = await fetchAccountTransactions(address, 100, res.lastTransaction);
            for (let t of ttxs) {
                if (t.id.lt === currentStatus.lastTransaction.lt) {
                    found = true;
                    break;
                }
                txs.push(t);
            }

            // Apply update
            if (!found) {
                loadedTransactions = txs.length;
                transactionCursor = ttxs[ttxs.length - 1].id;
                transactions = ttxs.map((v) => v.id.lt);
            } else {
                loadedTransactions = currentStatus.loadedTransactions + txs.length;
                transactionCursor = currentStatus.transactionCursor;
                transactions = [...txs.map((v) => v.id.lt), ...currentStatus.transactions];
            }
        }

        return {
            txs,
            status: {
                balance: res.balance,
                state: res.state,
                lastTransaction: res.lastTransaction,
                syncTime: res.timestamp,
                storedAt: Date.now(),
                transactionCursor,
                loadedTransactions,
                transactions
            }
        };
    }
}

export function useAccount(address: Address) {
    const [state, setState] = React.useState<AccountStatus | null>(() => {
        let ex = storage.getString('account_' + address.toFriendly());
        if (ex) {
            return parseStatus(ex);
        } else {
            return null;
        }
    });

    React.useEffect(() => {
        let ended = false;
        (async () => {
            backoff(async () => {
                while (!ended) {

                    // Refresh state
                    let ex = storage.getString('account_' + address.toFriendly());

                    // Fetch diff
                    let updated: { status: AccountStatus, txs: SimpleTransaction[] };
                    if (ex) {
                        console.log('Fetching update...');
                        let status = parseStatus(ex);
                        updated = await getAccountStatusUpdate(address, status);
                    } else {
                        // Fetching initial
                        console.log('Fetching initial...');
                        updated = await getAccountStatusInitial(address);
                    }

                    // Apply
                    for (let t of updated.txs) {
                        storage.set('tx_' + address.toFriendly() + '_' + padLt(t.id.lt), t.data);
                    }
                    storage.set('account_' + address.toFriendly(), serializeStatus(updated.status));
                    setState(updated.status);
                    console.log('Updated', updated);

                    await delay(5000);
                }
            })
        })();
        return () => { ended = true; }
    }, []);

    return state;
}