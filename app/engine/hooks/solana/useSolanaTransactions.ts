import { useInfiniteQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { SolanaAddress } from "../../../utils/solana/core";
import { useSolanaClient } from "..";
import { useEffect, useRef, useState } from "react";

const TRANSACTIONS_LENGTH = 16;

export function useSolanaTransactions(address: SolanaAddress) {
    const client = useSolanaClient();

    const query = useInfiniteQuery({
        queryKey: Queries.SolanaTransactions(address),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        getNextPageParam: (last, allPages) => {
            if (!last || allPages.length < 1 || !last[TRANSACTIONS_LENGTH - 2]) {
                return undefined;
            }

            const lastSigns = last[TRANSACTIONS_LENGTH - 1]?.transaction.signatures;
            const lastSign = lastSigns?.[lastSigns.length - 1];

            return lastSign;
        },
        queryFn: async () => {
            const signs = await client.getSignaturesForAddress(address, { limit: TRANSACTIONS_LENGTH }).send();

            const transactions = await Promise.all(signs.map(async (sign) => {
                const tx = await client.getTransaction(sign.signature, { maxSupportedTransactionVersion: 0 }).send();
                return tx;
            }));

            const filteredTransactions = transactions.filter((tx) => !!tx);

            return filteredTransactions;
        },
        refetchInterval: 35 * 1000
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

export type SolanaParsedTransaction = ReturnType<typeof useSolanaTransactions>['data'][number];
