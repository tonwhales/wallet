import { useCallback, useEffect, useState } from "react";
import { storagePersistence } from "../../storage/storage";
import { Engine } from "../Engine";
import { CardNotification, fetchCardsTransactions } from "../api/holders/fetchCardsTransactions";
import { watchHoldersAccountUpdates } from "./watchHoldersAccountUpdates";

export function getCardTransaction(card: string, id: string) {
    const storedString = storagePersistence.getString(`$holders-card-${card}-tx-${id}`);
    if (!storedString) {
        return null;
    }
    return JSON.parse(storedString) as CardNotification;
}

export function storeCardTransaction(card: string, id: string, tx: CardNotification) {
    storagePersistence.set(`$holders-card-${card}-tx-${id}`, JSON.stringify(tx));
}

export function useCardTransactions(engine: Engine, cardId: string) {
    const accountStatus = engine.persistence.holdersStatus.item(engine.address).value;
    const token = accountStatus?.state === 'ok' ? accountStatus.token : undefined;

    const txsItem = engine.persistence.holdersCardTransactions.item(cardId);
    const txsStored = txsItem.value || [];

    let txsInit: CardNotification[] = [];
    let hasMoreInit: 'storage' | 'network' | undefined = undefined;
    let cursorInit: string | undefined = txsStored[txsStored.length - 1];

    if (txsStored.length > 0) {
        txsInit = txsStored.slice(0, 40).map((tx) => getCardTransaction(cardId, tx)).filter((a) => !!a) as CardNotification[];
        hasMoreInit = txsStored.length - 1 > 40 ? 'storage' : 'network';
    }

    const [history, setHistory] = useState({
        cursor: cursorInit,
        txs: txsInit,
        hasMore: hasMoreInit
    });
    const [loading, setLoading] = useState(false);

    const loadFromStorage = useCallback(async () => {
        const cursorIndex = txsStored.indexOf(history.cursor ?? '');
        let hasMore: 'storage' | 'network' = (cursorIndex > 0 && cursorIndex < txsStored.length - 1) ? 'storage' : 'network';

        if (!hasMore) {
            return;
        }

        const txs = txsStored.slice(cursorIndex + 1, cursorIndex + 41);
        const txsData = txs.map((tx) => getCardTransaction(cardId, tx)).filter((a) => !!a) as CardNotification[];

        const newTxsState = [...history.txs, ...txsData];
        const newCursor = txs[txs.length - 1];

        hasMore = (txsStored.indexOf(txs[txs.length - 1]) < txsStored.length - 1) ? 'storage' : 'network';

        if (!hasMore && token) {
            setLoading(true);
            const res = await fetchCardsTransactions(token, cardId, newCursor, 1, 'desc');
            if (res && res.hasMore) {
                hasMore = 'network';
            }
        }

        setHistory({
            cursor: newCursor,
            txs: newTxsState,
            hasMore,
        });
        setLoading(false);
    }, [token, history, cardId, setHistory]);

    const loadFromNetwork = useCallback(async () => {
        if (!token) {
            return;
        }

        setLoading(true);
        const cardRes = await fetchCardsTransactions(token, cardId, history.cursor, 40, 'desc');

        if (cardRes) {
            for (let tx of cardRes.events) {
                storeCardTransaction(cardId, tx.id, tx);
            }
            engine.persistence.holdersCardTransactions.item(cardId).update((src) => {
                return [...(src || []), ...cardRes.events.map((tx) => tx.id)];
            });
            setHistory({
                cursor: cardRes.lastCursor,
                hasMore: cardRes.hasMore ? 'network' : undefined,
                txs: [...history.txs, ...cardRes.events]
            });
        }
        setLoading(false);
    }, [token, history, cardId, setHistory]);

    const loadMore = useCallback(async () => {
        if (loading) {
            return;
        }
        if (!history.hasMore) {
            return;
        }

        if (history.hasMore === 'storage') {
            await loadFromStorage();
            return;
        }

        await loadFromNetwork();
    }, [history, loading, loadFromNetwork, loadFromStorage]);

    const updateCardsTransactions = useCallback(async () => {
        if (!token) {
            return;
        }

        setLoading(true);
        const cardRes = await fetchCardsTransactions(token, cardId, undefined, 10, 'desc');

        if (cardRes) {
            let txsHead = cardRes.events;
            let last = (txsItem.value && txsItem.value.length > 0) ? txsItem.value[0] : undefined;
            let lastHeadIndex = txsHead.findIndex((tx) => tx.id === last);

            // Merge with stored
            if (lastHeadIndex >= 0) {
                txsHead = txsHead.slice(0, lastHeadIndex);
            } else if (last) {
                while (lastHeadIndex < 0) {
                    const res = await fetchCardsTransactions(token, cardId, txsHead[txsHead.length - 1].id, 40, 'desc');
                    txsHead = [...res.events, ...txsHead];
                    lastHeadIndex = txsHead.findIndex((tx) => tx.id === last);
                }
            }

            for (let tx of txsHead) {
                storeCardTransaction(cardId, tx.id, tx);
            }

            engine.persistence.holdersCardTransactions.item(cardId).update((src) => {
                return [...txsHead.map((tx) => tx.id), ...(src || [])];
            });

            setHistory((prev) => {
                return {
                    cursor: prev.cursor,
                    hasMore: prev.hasMore,
                    txs: [...txsHead, ...prev.txs]
                }
            });
        }

        setLoading(false);
    }, [token, setHistory]);

    // Update on mount
    useEffect(() => {
        (async () => {
            await loadFromStorage();
            if (token) {
                updateCardsTransactions();
            }
        })()
    }, []);

    useEffect(() => {
        let sub: (() => void) | null = null;
        if (token) {
            sub = watchHoldersAccountUpdates(
                token,
                (event) => {
                    if (event.type === 'accounts_changed' || event.type === 'balance_change' || event.type === 'limits_change') {
                        updateCardsTransactions();
                    }
                }
            );
        }
        return () => {
            if (sub) {
                sub();
                sub = null;
            }
        };
    }, [updateCardsTransactions]);

    return { history, loadMore, loading };
}