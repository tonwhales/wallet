import { useInfiniteQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { Address } from '@ton/core';
import { StoredTransaction, TonTransaction, TransactionType, CommonTx } from '../../types';
import { useClient4, useCurrentAddress, useNetwork, useUsdcMintAddress } from '..';
import { getLastBlock } from '../../accountWatcher';
import { queryClient } from '../../clients';
import { AccountTransactionsV3Cursor, fetchAccountTransactionsV3 } from '../../api/fetchAccountTransactionsV3';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TonClient4 } from '@ton/ton';
import { prepareMessages } from './usePeparedMessages';
import { fetchGaslessConfig, GaslessConfig } from '../../api/gasless/fetchGaslessConfig';
import { fetchContractInfo } from '../../api/fetchContractInfo';
import { getJettonHint } from '../jettons/useJetton';
import { mapJettonFullToMasterState } from '../../../utils/jettons/mapJettonToMasterState';
import { getHintFull } from '../../../utils/jettons/hintSortFilter';
import { JettonFull } from '../../api/fetchHintsFull';
import { SolanaTransaction } from '../../api/solana/fetchSolanaTransactions';
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { isUSDCTransaction } from '../../../utils/solana/isUSDCTransaction';
import { useFocusEffect } from '@react-navigation/native';

const DEFAULT_PAGE_SIZE = 32;
const REFRESH_TIMEOUT = 35000;
const STALE_TIME = 5000;

export type CommonTransaction = {
    type: TransactionType.TON;
    data: TonTransaction;
} | {
    type: TransactionType.SOLANA;
    data: SolanaTransaction;
};

interface UseAccountTransactionsResult {
    data: CommonTransaction[] | null;
    next: () => void;
    hasNext: boolean;
    loading: boolean;
    refresh: (silent?: boolean) => void;
    refreshing: boolean;
}

interface QueryContext {
    pageParam?: AccountTransactionsV3Cursor;
}

function getLastTransactionFromPages(pages: CommonTransaction[][]): { ton: TonTransaction | null, solana: SolanaTransaction | null, solanaToken: SolanaTransaction | null } {
    if (pages.length === 0) return { ton: null, solana: null, solanaToken: null };

    const allTransactions = pages.flat();
    const lastTon = [...allTransactions].reverse().find((tx): tx is { type: TransactionType.TON; data: TonTransaction } => tx.type === TransactionType.TON)?.data || null;
    const lastSolana = [...allTransactions].reverse().find((tx): tx is { type: TransactionType.SOLANA; data: SolanaTransaction } =>
        tx.type === TransactionType.SOLANA && !isUSDCTransaction(tx.data)
    )?.data || null;
    const lastSolanaToken = [...allTransactions].reverse().find((tx): tx is { type: TransactionType.SOLANA; data: SolanaTransaction } =>
        tx.type === TransactionType.SOLANA && isUSDCTransaction(tx.data)
    )?.data || null;

    return { ton: lastTon, solana: lastSolana, solanaToken: lastSolanaToken };
}

function shouldLoadNextPage(lastPage: CommonTransaction[] | undefined, totalPages: number, limit: number | undefined): boolean {
    if (!lastPage || totalPages < 1) {
        return false;
    }
    return lastPage.length >= (limit ?? DEFAULT_PAGE_SIZE) - 2;
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

function hasJettonTransactions(transactions: CommonTransaction[]): boolean {
    return transactions.some(tx => {
        if (tx.type === TransactionType.TON) {
            return tx.data.base.operation.items.length > 0 && tx.data.base.operation.items[0].kind === 'token';
        }
        return false;
    });
}

function areTransactionsEqual(tx1: CommonTransaction, tx2: CommonTransaction): boolean {
    if (tx1.type === TransactionType.TON && tx2.type === TransactionType.TON) {
        return tx1.data.lt === tx2.data.lt && tx1.data.hash === tx2.data.hash;
    }
    if (tx1.type === TransactionType.SOLANA && tx2.type === TransactionType.SOLANA) {
        return tx1.data.signature === tx2.data.signature;
    }
    return false;
}

function createNextPageParam(lastTransactions: { ton: TonTransaction | null, solana: SolanaTransaction | null, solanaToken: SolanaTransaction | null }, usdcMint: string): AccountTransactionsV3Cursor {
    const cursor: AccountTransactionsV3Cursor = {};

    if (lastTransactions.ton) {
        cursor.ton = {
            lt: lastTransactions.ton.lt,
            hash: lastTransactions.ton.hash
        };
    }

    if (lastTransactions.solana) {
        cursor.solana = {
            before: lastTransactions.solana.signature
        };
    }

    if (lastTransactions.solanaToken) {
        cursor.solanaToken = {
            before: lastTransactions.solanaToken.signature,
            mint: usdcMint
        };
    }

    return cursor;
}

async function getInitialCursor(client: TonClient4, account: string, usdcMint: string): Promise<AccountTransactionsV3Cursor> {
    const cursor: AccountTransactionsV3Cursor = {};

    try {
        const accountAddr = Address.parse(account);
        const accountLite = await client.getAccountLite(await getLastBlock(), accountAddr);

        if (accountLite.account.last) {
            cursor.ton = {
                lt: accountLite.account.last.lt,
                hash: accountLite.account.last.hash
            };
        }
    } catch (e) {
        console.warn('Failed to get TON initial cursor:', e);
    }

    // Solana and USDC cursor are initialized as undefined, API will handle it
    cursor.solana = { before: null };
    cursor.solanaToken = { before: null, mint: usdcMint };

    return cursor;
}

async function fetchTransactionsPage(
    account: {
        tonAddress: string;
        solanaAddress: string;
        solanaATAaddress: string
    },
    isTestnet: boolean,
    cursor: AccountTransactionsV3Cursor,
    limit: number | undefined,
): Promise<CommonTransaction[]> {
    const res = await fetchAccountTransactionsV3(account, cursor, isTestnet, limit);

    return res.data.map((tx: CommonTx) => {
        if (tx.type === TransactionType.TON) {
            return {
                type: TransactionType.TON,
                data: transformStoredToTonTransaction(tx.data as StoredTransaction)
            };
        } else {
            return {
                type: TransactionType.SOLANA,
                data: tx.data as SolanaTransaction
            };
        }
    });
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

export const formatTransactions = async (transactions: CommonTransaction[], isTestnet: boolean, owner: Address | null) => {
    const result: CommonTransaction[] = [];
    let gaslessConfig: GaslessConfig | null = null;
    try {
        gaslessConfig = await fetchGaslessConfig(isTestnet)
    } catch (e) {
        console.log('ERROR', e);
    }

    for (const tx of transactions) {
        // Solana transactions don't need formatting, return as is
        if (tx.type === TransactionType.SOLANA) {
            result.push(tx);
            continue;
        }

        // Format TON transaction
        const tonTx = tx.data;
        if (tonTx.base.outMessages.length > 1) {
            const preparedMessages = prepareMessages(tonTx.base.outMessages, isTestnet, owner, gaslessConfig);
            for (const message of preparedMessages) {
                if (message.type === 'relayed') continue;
                const operation = message.operation;
                const item = operation.items[0];

                // If item.kind === 'token' but jettonMaster is not found (for example, swap on DEX), use TON from items[1]
                const actualItem = item.kind === 'token' && !message.jettonMaster && operation.items.length > 1
                    ? operation.items[1]
                    : item;

                const opAddress = actualItem.kind === 'token' ? operation.address : message.friendlyTarget;
                const contractInfo = await fetchContractInfo(opAddress);
                const symbolText = actualItem.kind === 'ton'
                    ? ' TON'
                    : (message.jettonMaster?.symbol ? ` ${message.jettonMaster.symbol}` : '')
                result.push({
                    type: TransactionType.TON,
                    data: { ...tonTx, message, contractInfo, symbolText }
                });
            }
        } else {
            try {
                const operation = tonTx.base.operation;
                const item = operation.items[0];

                const jettonHint = getJettonHint({
                    owner: owner!,
                    master: tonTx.base.parsed.resolvedAddress,
                    wallet: tonTx.base.parsed.resolvedAddress,
                    isTestnet,
                })
                const jettonMaster = jettonHint ? mapJettonFullToMasterState(jettonHint) : null;

                // If item.kind === 'token', but jettonMaster is not found (for example, swap on DEX), use TON from items[1]
                const actualItem = item.kind === 'token' && !jettonMaster && operation.items.length > 1
                    ? operation.items[1]
                    : item;

                const opAddress = actualItem.kind === 'token' ? operation.address : tonTx.base.parsed.resolvedAddress;
                const contractInfo = await fetchContractInfo(opAddress);
                const { isSCAM } = jettonHint ? getHintFull(jettonHint as JettonFull, isTestnet) : { isSCAM: false };
                const symbolText = actualItem.kind === 'ton'
                    ? ' TON'
                    : (jettonMaster?.symbol
                        ? ` ${jettonMaster.symbol}${isSCAM ? ' • SCAM' : ''}`
                        : '')
                const jettonDecimals = actualItem.kind === 'ton' ? undefined : jettonMaster?.decimals;
                result.push({
                    type: TransactionType.TON,
                    data: { ...tonTx, contractInfo, symbolText, jettonDecimals }
                });

            } catch (e) {
                console.log('ERROR', e);
            }
        }
    }
    return result;
}

export function useAccountTransactionsV3(
    options: { refetchOnMount: boolean, limit?: number, refetchFirstPageOnWindowFocus?: boolean },
): UseAccountTransactionsResult {
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    const { tonAddress, tonAddressString, solanaAddress } = useCurrentAddress();
    const usdcMintAddress = useUsdcMintAddress();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const isFetchingRef = useRef(false);

    const query = useInfiniteQuery<CommonTransaction[]>({
        queryKey: Queries.TransactionsV3(tonAddressString, solanaAddress),
        staleTime: STALE_TIME,
        enabled: !!tonAddressString,
        getNextPageParam: (lastPage, allPages) => {
            if (!shouldLoadNextPage(lastPage, allPages.length, options.limit)) {
                return undefined;
            }

            const lastTransactions = getLastTransactionFromPages(allPages);
            if (lastTransactions.ton || lastTransactions.solana || lastTransactions.solanaToken) {
                return createNextPageParam(lastTransactions, usdcMintAddress);
            }

            return undefined;
        },
        queryFn: async (ctx: QueryContext) => {
            const address = tonAddress;
            const isFirstPage = !ctx.pageParam;
            let cursor: AccountTransactionsV3Cursor;

            if (isFirstPage) {
                cursor = await getInitialCursor(client, tonAddressString, usdcMintAddress);
            } else {
                cursor = ctx.pageParam!;
            }

            const solanaATAaddress = await getAssociatedTokenAddress(new PublicKey(usdcMintAddress), new PublicKey(solanaAddress!), true);

            const account = {
                tonAddress: tonAddressString,
                solanaAddress: solanaAddress || '',
                solanaATAaddress: solanaATAaddress.toString()
            };

            const transactions = await fetchTransactionsPage(account, isTestnet, cursor, options.limit ?? DEFAULT_PAGE_SIZE);

            // For TON, the cursor is inclusive (includes the last transaction from previous page)
            // So we need to skip the first TON transaction if it matches the cursor
            // For Solana, the cursor is exclusive (before signature), so no need to skip
            let result = transactions;
            if (!isFirstPage && ctx.pageParam) {
                const prevTonCursor = ctx.pageParam.ton;
                if (prevTonCursor?.lt && prevTonCursor?.hash) {
                    // Remove TON transaction that matches the cursor
                    result = transactions.filter(tx => {
                        if (tx.type === TransactionType.TON) {
                            return !(tx.data.lt === prevTonCursor.lt && tx.data.hash === prevTonCursor.hash);
                        }
                        return true;
                    });
                }
            }

            // Invalidate jetton hints if we found jetton transactions
            if (hasJettonTransactions(result)) {
                queryClient.invalidateQueries({ queryKey: Queries.HintsFull(tonAddressString) });
            }

            console.log(`[txnsV3-queryFn] ✅ ${isFirstPage ? 'FIRST' : 'NEXT'} PAGE: ${result.length} transactions`);
            return await formatTransactions(result, isTestnet, address);

        },
        structuralSharing: optimizeDataStructure,
    });

    useEffect(() => {
        isFetchingRef.current = query.isFetching;
    }, [query.isFetching]);

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
        if (!isFetchingRef.current && options.refetchOnMount && !query.isFetchingNextPage) {
            query.refetch({ refetchPage: (_, index) => index === 0 });
        }
    }, [options.refetchOnMount]);

    useFocusEffect(useCallback(() => {
        if (!isFetchingRef.current && options.refetchFirstPageOnWindowFocus) {
            query.refetch({ refetchPage: (_, index) => index === 0 });
        }
    }, [options.refetchFirstPageOnWindowFocus]));

    const next = useCallback(() => {
        if (!query.isFetchingNextPage && query.hasNextPage) {
            query.fetchNextPage();
        }
    }, [query.isFetchingNextPage, query.hasNextPage, query.fetchNextPage]);

    const refresh = useCallback(async (silent?: boolean) => {
        if (!silent) {
            setIsRefreshing(true);
        }

        try {
            await query.refetch({ refetchPage: (_, index) => index === 0 });
        } catch {
            // Ignore errors, isRefreshing will be reset by useEffect
        }

        if (!silent) {
            setIsRefreshing(false);
        }
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