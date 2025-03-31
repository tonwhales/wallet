import { useInfiniteQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { Address } from '@ton/core';
import { AccountStoredTransaction, HoldersTransaction, StoredTransaction, TonTransaction, TransactionType } from '../../types';
import { useClient4, useHoldersAccountStatus, useNetwork } from '..';
import { getLastBlock } from '../../accountWatcher';
import { log } from '../../../utils/log';
import { queryClient } from '../../clients';
import { HoldersUserState } from '../../api/holders/fetchUserState';
import { AccountTransactionsParams, AccountTransactionsV2Cursor, fetchAccountTransactionsV2, HoldersCursor, TonCursor } from '../../api/fetchAccountTransactionsV2';
import { useEffect, useRef, useState } from 'react';

const TRANSACTIONS_LENGTH = 16;

export function useAccountTransactionsV2(
    account: string,
    options: { refetchOnMount: boolean } = { refetchOnMount: false },
    params?: AccountTransactionsParams
): {
    data: AccountStoredTransaction[] | null,
    next: () => void,
    hasNext: boolean,
    loading: boolean,
    refresh: () => void,
    refreshing: boolean
} {
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    const status = useHoldersAccountStatus(account).data;

    const token = (
        !!status &&
        status.state === HoldersUserState.Ok
    ) ? status.token : undefined;

    let raw = useInfiniteQuery<AccountStoredTransaction[]>({
        queryKey: Queries.TransactionsV2(account, !!token, params),
        refetchOnWindowFocus: true,
        getNextPageParam: (last, allPages) => {
            if (!last || allPages.length < 1 || !last[TRANSACTIONS_LENGTH - 2]) {
                return undefined;
            }

            let lastTon: TonTransaction | undefined;
            let lastHolders: HoldersTransaction | undefined;

            for (let i = allPages.length - 1; i >= 0; i--) {
                for (let j = allPages[i].length - 1; j >= 0; j--) {
                    const item = allPages[i][j];
                    if (item.type === TransactionType.TON) {
                        if (lastTon && lastHolders) {
                            break;
                        } else if (lastTon) {
                            continue;
                        }
                        lastTon = item.data as TonTransaction;
                        continue;
                    }

                    if (lastTon && lastHolders) {
                        break;
                    } else if (lastHolders) {
                        continue;
                    }


                    lastHolders = item.data as HoldersTransaction;
                }
            }

            if (!lastTon && !lastHolders) {
                return undefined;
            }

            return {
                ton: lastTon ? { lt: lastTon.lt, hash: lastTon.hash } : undefined,
                holders: !!lastHolders?.id ? { fromCursor: lastHolders.id } : undefined
            };
        },
        queryFn: async (ctx) => {
            let accountAddr = Address.parse(account);
            let tonCursor: TonCursor | undefined;
            let holdersCursor: HoldersCursor | undefined;
            let sliceFirst: boolean = false;

            const pageParam = ctx.pageParam as (AccountTransactionsV2Cursor | undefined);

            if (!!pageParam) {
                sliceFirst = true;
                tonCursor = pageParam.ton;
                holdersCursor = pageParam.holders;
            } else {
                let accountLite = await client.getAccountLite(await getLastBlock(), accountAddr);
                if (!accountLite.account.last) {
                    return [];
                }

                tonCursor = { lt: accountLite.account.last.lt, hash: accountLite.account.last.hash };
            }

            log(`[txns-query] fetching ${tonCursor ? `ton: ${JSON.stringify(tonCursor)}` : ''} ${holdersCursor ? `holders: ${JSON.stringify(holdersCursor)}` : ''} ${sliceFirst ? 'sliceFirst' : ''}`);

            const cursor: AccountTransactionsV2Cursor = { ton: tonCursor, holders: holdersCursor };

            const res = await fetchAccountTransactionsV2(accountAddr, isTestnet, cursor, token, params);
            let txs: AccountStoredTransaction[] = [];
            let shouldRefetchJttons = false;

            // Add jetton wallets to hints (in case of hits worker lag being to high)
            txs = res.data.map(t => {
                if (t.type !== TransactionType.TON) {
                    return {
                        type: TransactionType.HOLDERS,
                        data: t.data as HoldersTransaction,
                        hasMore: res.hasMore
                    };
                }

                const base = t.data as StoredTransaction;

                if (!shouldRefetchJttons) {
                    shouldRefetchJttons = base.operation.items.length > 0
                        ? base.operation.items[0].kind === 'token'
                        : false;
                }

                return {
                    type: TransactionType.TON,
                    data: {
                        id: `${base.lt}_${base.hash}`,
                        base: base,
                        outMessagesCount: base.outMessagesCount,
                        outMessages: base.outMessages,
                        lt: base.lt,
                        hash: base.hash
                    } as TonTransaction
                };
            });

            if (sliceFirst) {
                txs = txs.slice(1);
            }

            log(`[txns-query] fetched ${txs.length} txs`);

            if (shouldRefetchJttons) {
                queryClient.invalidateQueries({ queryKey: Queries.HintsFull(account) });
            }

            return txs;
        },
        structuralSharing: (old, next) => {
            const firstOld = old?.pages?.[0];
            const firstNext = next?.pages?.[0];

            // If something absent
            if (!firstOld || !firstNext) {
                return next;
            }

            if (firstOld.length < 1 || firstNext.length < 1) {
                return next;
            }

            // If first elements are equal
            if (firstOld[0].type === firstNext[0].type) {
                if (firstOld[0].type === TransactionType.TON) {
                    const firstOldTon = firstOld[0].data;
                    const firstNextTon = firstNext[0].data as TonTransaction;

                    if (firstOldTon.lt === firstNextTon.lt && firstOldTon.hash === firstNextTon.hash) {
                        return next;
                    }
                } else {
                    const firstOldHolders = firstOld[0].data as HoldersTransaction;
                    const firstNextHolders = firstNext[0].data as HoldersTransaction;

                    if (firstOldHolders.id === firstNextHolders.id) {
                        return next;
                    }
                }
            }

            // Something changed, rebuild the list
            let offset = firstNext.findIndex(a => {
                if (a.type === TransactionType.TON) {
                    const aTon = a.data as TonTransaction;

                    if (firstOld[0].type !== TransactionType.TON) {
                        return false;
                    }

                    return aTon.lt === firstOld[0].data.lt && aTon.hash === firstOld[0].data.hash;
                } else {
                    const aHolders = a.data as HoldersTransaction;

                    if (firstOld[0].type !== TransactionType.HOLDERS) {
                        return false;
                    }

                    return aHolders.id === (firstOld[0].data as HoldersTransaction).id;
                }
            });

            // If not found, we need to invalidate the whole list
            if (offset === -1) {
                return {
                    pageParams: [next.pageParams[0]],
                    pages: [next.pages[0]],
                };
            }

            // If found, we need to shift pages and pageParams
            let pages: AccountStoredTransaction[][] = [next.pages[0]];
            let pageParams: AccountTransactionsV2Cursor[] = [next.pageParams[0] as any];
            let tail = old!.pages[0].slice(TRANSACTIONS_LENGTH - offset);
            let nextPageParams = {
                ton: next.pages[0][next.pages[0].length - 1].type === TransactionType.TON
                    ? { lt: (next.pages[0][next.pages[0].length - 1].data as TonTransaction).lt, hash: (next.pages[0][next.pages[0].length - 1].data as TonTransaction).hash }
                    : undefined,
                holders: next.pages[0][next.pages[0].length - 1].type === TransactionType.HOLDERS
                    ? { fromCursor: (next.pages[0][next.pages[0].length - 1].data as HoldersTransaction).time.toString() }
                    : undefined
            }

            for (let page of old!.pages.slice(1)) {
                let newPage = tail.concat(page.slice(0, TRANSACTIONS_LENGTH - 1 - offset));
                pageParams.push(nextPageParams);
                pages.push(newPage);

                tail = page.slice(TRANSACTIONS_LENGTH - 1 - offset);
                nextPageParams = {
                    ton: newPage[newPage.length - 1].type === TransactionType.TON
                        ? { lt: (newPage[newPage.length - 1].data as TonTransaction).lt, hash: (newPage[newPage.length - 1].data as TonTransaction).hash }
                        : undefined,
                    holders: newPage[newPage.length - 1].type === TransactionType.HOLDERS
                        ? { fromCursor: (newPage[newPage.length - 1].data as HoldersTransaction).time.toString() }
                        : undefined
                };
            }

            return { pages, pageParams };
        },
        staleTime: 5 * 1000
    });

    // Refreshing state only for manual on pull to refresh called
    const [isRefreshing, setIsRefreshing] = useState(false);
    const timerRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!raw.isRefetching) {
            setIsRefreshing(false);
        } else {
            timerRef.current = setTimeout(() => {
                setIsRefreshing(false);
            }, 35000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        }
    }, [raw.isRefetching]);

    useEffect(() => {
        if (options.refetchOnMount) {
            raw.refetch({ refetchPage: (last, index, allPages) => index == 0 });
        }
    }, [options.refetchOnMount]);

    return {
        data: raw.data?.pages.flat() || null,
        next: () => {
            if (!raw.isFetchingNextPage && !raw.isFetching && raw.hasNextPage) {
                raw.fetchNextPage();
            }
        },
        refresh: () => {
            setIsRefreshing(true);
            raw.refetch({ refetchPage: (last, index, allPages) => index == 0 });
        },
        refreshing: isRefreshing,
        hasNext: !!raw.hasNextPage,
        loading: raw.isFetching,
    }
}