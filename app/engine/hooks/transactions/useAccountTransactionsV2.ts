import { useInfiniteQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { Address } from '@ton/core';
import { StoredTransaction, TonTransaction, TransactionType } from '../../types';
import { useClient4, useNetwork } from '..';
import { getLastBlock } from '../../accountWatcher';
import { queryClient } from '../../clients';
import { AccountTransactionsParams, TonCursor, fetchAccountTransactionsV2 } from '../../api/fetchAccountTransactionsV2';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TonClient4 } from '@ton/ton';
import { prepareMessages } from './usePeparedMessages';
import { fetchGaslessConfig, GaslessConfig } from '../../api/gasless/fetchGaslessConfig';
import { fetchContractInfo } from '../../api/fetchContractInfo';
import { getJettonHint } from '../jettons/useJetton';
import { mapJettonFullToMasterState } from '../../../utils/jettons/mapJettonToMasterState';
import { getHintFull } from '../../../utils/jettons/hintSortFilter';
import { JettonFull } from '../../api/fetchHintsFull';

const PAGE_SIZE = 16;
const REFRESH_TIMEOUT = 35000;
const STALE_TIME = 5000;

interface UseAccountTransactionsResult {
    data: TonTransaction[] | null;
    next: () => void;
    hasNext: boolean;
    loading: boolean;
    refresh: () => void;
    refreshing: boolean;
}

interface QueryContext {
    pageParam?: { ton: TonCursor };
}

function getLastTransactionFromPages(pages: TonTransaction[][]): TonTransaction | null {
    if (pages.length === 0) return null;

    const lastPage = pages[pages.length - 1];
    return lastPage.length > 0 ? lastPage[lastPage.length - 1] : null;
}

function shouldLoadNextPage(lastPage: TonTransaction[] | undefined, totalPages: number): boolean {
    if (!lastPage || totalPages < 1) {
        return false;
    }
    return lastPage.length >= PAGE_SIZE - 2;
}

function transformStoredToTonTransaction(stored: StoredTransaction): TonTransaction {
    return {
        id: `${stored.lt}_${stored.hash}`,
        base: stored,
        outMessagesCount: stored.outMessagesCount,
        outMessages: stored.outMessages,
        lt: stored.lt,
        hash: stored.hash
    };
}

function hasJettonTransactions(transactions: TonTransaction[]): boolean {
    return transactions.some(tx =>
        tx.base.operation.items.length > 0 &&
        tx.base.operation.items[0].kind === 'token'
    );
}

function areTransactionsEqual(tx1: TonTransaction, tx2: TonTransaction): boolean {
    return tx1.lt === tx2.lt && tx1.hash === tx2.hash;
}

function createNextPageParam(lastTransaction: TonTransaction): { ton: TonCursor } {
    return {
        ton: {
            lt: lastTransaction.lt,
            hash: lastTransaction.hash
        }
    };
}

async function getInitialCursor(client: TonClient4, account: string): Promise<TonCursor | null> {
    const accountAddr = Address.parse(account);
    const accountLite = await client.getAccountLite(await getLastBlock(), accountAddr);

    if (!accountLite.account.last) {
        return null;
    }

    return {
        lt: accountLite.account.last.lt,
        hash: accountLite.account.last.hash
    };
}

async function fetchTransactionsPage(
    account: string,
    isTestnet: boolean,
    cursor: TonCursor | null,
    params?: AccountTransactionsParams
): Promise<TonTransaction[]> {
    if (!cursor) {
        return [];
    }

    const accountAddr = Address.parse(account);
    const apiCursor = { ton: cursor };

    const res = await fetchAccountTransactionsV2(accountAddr, isTestnet, apiCursor, undefined, params);

    return res.data
        .filter(t => t.type === TransactionType.TON)
        .map(t => transformStoredToTonTransaction(t.data as StoredTransaction));
}

function optimizeDataStructure(old: any, next: any): any {
    // If old data doesn't exist, use new data
    if (!old?.pages || old.pages.length === 0) {
        return next;
    }

    // If next data doesn't exist, keep old data  
    if (!next?.pages || next.pages.length === 0) {
        return old;
    }

    const oldFirstPage = old.pages[0];
    const nextFirstPage = next.pages[0];

    // If pages are empty, use next
    if (!oldFirstPage?.length || !nextFirstPage?.length) {
        return next;
    }

    // If we have more pages, definitely use new data (new pages loaded)
    if (next.pages.length > old.pages.length) {
        return next;
    }

    // If we have fewer pages, use new data (refresh happened)  
    if (next.pages.length < old.pages.length) {
        return next;
    }

    // Same number of pages - check if first transaction changed
    if (areTransactionsEqual(oldFirstPage[0], nextFirstPage[0])) {
        return old;
    }

    // Data has changed, use new data
    return next;
}

export const formatTransactions = async (transactions: TonTransaction[], isTestnet: boolean, owner: Address | null) => {
    const result: TonTransaction[] = [];
    let gaslessConfig: GaslessConfig | null = null;
    try {
        gaslessConfig = await fetchGaslessConfig(isTestnet)
    } catch (e) {
        console.log('ERROR', e);
    }

    for (const tx of transactions) {
        if (tx.base.outMessages.length > 1) {
            const preparedMessages = prepareMessages(tx.base.outMessages, isTestnet, owner, gaslessConfig);
            for (const message of preparedMessages) {
                if (message.type === 'relayed') continue;
                const operation = message.operation;
                const item = operation.items[0];
                const opAddress = item.kind === 'token' ? operation.address : message.friendlyTarget;
                const contractInfo = await fetchContractInfo(opAddress);
                const symbolText = item.kind === 'ton'
                ? ' TON'
                : (message.jettonMaster?.symbol ? ` ${message.jettonMaster.symbol}` : '')
                result.push({ ...tx, message, contractInfo, symbolText });
            }
        } else {
            try {
                const operation = tx.base.operation;
                const item = operation.items[0];
                const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
                const contractInfo = await fetchContractInfo(opAddress);
                const jettonHint = getJettonHint({
                    owner: owner!,
                    master: tx.base.parsed.resolvedAddress,
                    wallet: tx.base.parsed.resolvedAddress,
                    isTestnet,
                })
                const jettonMaster = jettonHint ? mapJettonFullToMasterState(jettonHint) : null;
                const { isSCAM } = jettonHint ? getHintFull(jettonHint as JettonFull, isTestnet) : { isSCAM: false };
                const symbolText = item.kind === 'ton'
                    ? ' TON'
                    : (jettonMaster?.symbol
                        ? ` ${jettonMaster.symbol}${isSCAM ? ' • SCAM' : ''}`
                        : '')
                const jettonDecimals = item.kind === 'ton' ? undefined : jettonMaster?.decimals;
                result.push({ ...tx, contractInfo, symbolText, jettonDecimals });

            } catch (e) {
                console.log('ERROR', e);
            }
        }
    }    
    return result;
}

export function useAccountTransactionsV2(
    account: string,
    options: { refetchOnMount: boolean } = { refetchOnMount: false },
    params?: AccountTransactionsParams
): UseAccountTransactionsResult {
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    const address = Address.parse(account);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const refreshTimeoutRef = useRef<NodeJS.Timeout>();

    const query = useInfiniteQuery<TonTransaction[]>({
        queryKey: Queries.TransactionsV2(account, false, params),
        refetchOnWindowFocus: true,
        staleTime: STALE_TIME,
        getNextPageParam: (lastPage, allPages) => {
            if (!shouldLoadNextPage(lastPage, allPages.length)) {
                return undefined;
            }

            const lastTransaction = getLastTransactionFromPages(allPages);
            if (lastTransaction) {
                return createNextPageParam(lastTransaction);
            }

            return undefined;
        },
        queryFn: async (ctx: QueryContext) => {
            const isFirstPage = !ctx.pageParam;
            let cursor: TonCursor | null;

            if (isFirstPage) {
                cursor = await getInitialCursor(client, account);
            } else {
                cursor = ctx.pageParam!.ton;
            }

            const transactions = await fetchTransactionsPage(account, isTestnet, cursor, params);

            // Skip first transaction for subsequent pages to avoid duplicates
            const result = isFirstPage ? transactions : transactions.slice(1);

            // Invalidate jetton hints if we found jetton transactions
            if (hasJettonTransactions(result)) {
                queryClient.invalidateQueries({ queryKey: Queries.HintsFull(account) });
            }

            console.log(`[txns-queryFn] ✅ ${isFirstPage ? 'FIRST' : 'NEXT'} PAGE: ${result.length} transactions`);
            return await formatTransactions(result, isTestnet, address);

        },
        structuralSharing: optimizeDataStructure,
    });

    // Handle refresh timeout
    useEffect(() => {
        if (!query.isRefetching) {
            setIsRefreshing(false);
        } else {
            refreshTimeoutRef.current = setTimeout(() => {
                setIsRefreshing(false);
            }, REFRESH_TIMEOUT);
        }

        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [query.isRefetching]);

    // Handle refetch first page on mount
    useEffect(() => {
        if (options.refetchOnMount && !query.isFetchingNextPage) {
            query.refetch({ refetchPage: (_, index) => index === 0 });
        }
    }, [options.refetchOnMount]);

    const next = useCallback(() => {
        if (!query.isFetchingNextPage && query.hasNextPage) {
            query.fetchNextPage();
        }
    }, [query.isFetchingNextPage, query.hasNextPage, query.fetchNextPage]);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await query.refetch({ refetchPage: (_, index) => index === 0 });
        } catch {
            // Ignore errors, isRefreshing will be reset by useEffect
        }
        setIsRefreshing(false);
    }, [query.refetch]);

    return {
        data: query.data?.pages.flat() || null,
        loading: query.isFetching,
        refreshing: isRefreshing,
        hasNext: !!query.hasNextPage,
        next,
        refresh
    };
}