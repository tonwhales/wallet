import { useInfiniteQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "..";
import { useEffect, useRef, useState } from "react";
import { fetchSolanaTransactions, SolanaTransaction } from "../../api/solana/fetchSolanaTransactions";

const TRANSACTIONS_LENGTH = 16;

export function useSolanaTokenTransactions(address: string, mint: string) {
    const { isTestnet } = useNetwork();

    const query = useInfiniteQuery<SolanaTransaction[]>({
        queryKey: Queries.SolanaAccount(address, isTestnet ? 'devnet' : 'mainnet').TokenTransactions(mint),
        refetchOnWindowFocus: true,
        getNextPageParam: (last, allPages) => {
            if (!last || allPages.length < 1 || !last[TRANSACTIONS_LENGTH - 2]) {
                return undefined;
            }

            return last[TRANSACTIONS_LENGTH - 1]?.signature;
        },
        queryFn: async (ctx) => {
            try {
                const pageParam = ctx.pageParam as (string | undefined);
                return await fetchSolanaTransactions(address, isTestnet, { limit: TRANSACTIONS_LENGTH, before: pageParam, mint });
            } catch (error) {
                console.error(error);
                throw error;
            }
        },
        structuralSharing: (old, next) => {
            const firstOld = old?.pages?.[0];
            const firstNext = next?.pages?.[0];

            if (!firstOld || !firstNext) {
                return next;
            }

            if (firstOld.length < 1 || firstNext.length < 1) {
                return next;
            }

            // If first elements are equal
            if (firstOld[0]?.signature === firstNext[0]?.signature) {
                return next;
            }

            // Something changed, rebuild the list
            let offset = firstNext.findIndex(a => a.signature === firstOld![0].signature && a.signature === firstOld![0].signature);

            // If not found, we need to invalidate the whole list
            if (offset === -1) {
                return {
                    pageParams: [next.pageParams[0]],
                    pages: [next.pages[0]],
                };
            }

            // If found, we need to shift pages and pageParams
            let pages: SolanaTransaction[][] = [next.pages[0]];
            let pageParams: (string | undefined)[] = [next.pageParams[0] as any];
            let tail = old!.pages[0].slice(TRANSACTIONS_LENGTH - offset);
            let nextPageParams = next.pages[0][next.pages[0].length - 1].signature;

            for (let page of old!.pages.slice(1)) {
                let newPage = tail.concat(page.slice(0, TRANSACTIONS_LENGTH - 1 - offset));
                pageParams.push(nextPageParams);
                pages.push(newPage);

                tail = page.slice(TRANSACTIONS_LENGTH - 1 - offset);
                nextPageParams = newPage[newPage.length - 1].signature;
            }

            return { pages, pageParams };
        },
        staleTime: 1000 * 5
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    const timerRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!query.isRefetching) {
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
    }, [query.isRefetching]);

    // Refetch only first page on mount instead of refetching all pages (in case of token transactions it would search through all transactions to find token transfers)
    useEffect(() => {
        query.refetch({ refetchPage: (last, index, allPages) => index == 0 });
    }, []);

    return {
        data: query.data?.pages.flat() || [],
        hasNext: query.hasNextPage || false,
        next: () => {
            if (!query.isFetchingNextPage && !query.isFetching && query.hasNextPage) {
                query.fetchNextPage();
            }
        },
        refresh: () => {
            setIsRefreshing(true);
            query.refetch({ refetchPage: (last, index, allPages) => index == 0 });
        },
        refreshing: isRefreshing,
        loading: query.isFetching || query.isRefetching,
    }
}

export type SolanaTokenTransaction = ReturnType<typeof useSolanaTokenTransactions>['data'][number];
