import { useInfiniteQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork } from "..";
import { useEffect, useRef, useState } from "react";
import { fetchSolanaTransactions, SolanaTransaction } from "../../api/solana/fetchSolanaTransactions";

const TRANSACTIONS_LENGTH = 16;

export function useSolanaTransactions(address: string) {
    const { isTestnet } = useNetwork();

    const query = useInfiniteQuery<SolanaTransaction[]>({
        queryKey: Queries.SolanaTransactions(address, isTestnet ? 'devnet' : 'mainnet'),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        getNextPageParam: (last, allPages) => {
            if (!last || allPages.length < 1 || !last[TRANSACTIONS_LENGTH - 2]) {
                return undefined;
            }

            return last[TRANSACTIONS_LENGTH - 1]?.signature;
        },
        queryFn: async (ctx) => {
            const pageParam = ctx.pageParam as (string | undefined);
            try {
                const transactions = await fetchSolanaTransactions(address, isTestnet, { limit: TRANSACTIONS_LENGTH, before: pageParam });
                return transactions;
            } catch (error) {
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

            if (firstOld[0].signature === firstNext[0].signature) {
                return next;
            }

            return next;
        }
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

    return {
        data: query.data?.pages.flat() || [],
        hasNext: query.hasNextPage || false,
        next: () => {
            if (!query.isFetchingNextPage && !query.isFetching && query.hasNextPage) {
                query.fetchNextPage();
            }
        },
        refresh: query.refetch,
        refreshing: isRefreshing,
        loading: query.isFetching || query.isRefetching,
    }
}
