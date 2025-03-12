import { useInfiniteQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { useNetwork, useSolanaClient } from "..";
import { useEffect, useRef, useState } from "react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { rpcEndpoint } from "./useSolanaClient";
import { PublicKey } from "@solana/web3.js";

const TRANSACTIONS_LENGTH = 16;

export function useSolanaTokenTransactions(address: string, token: string) {
    const client = useSolanaClient();
    const { isTestnet } = useNetwork();
    const rpc = rpcEndpoint(isTestnet);

    const query = useInfiniteQuery({
        queryKey: Queries.SolanaTokenTransactions(address, token, isTestnet ? 'devnet' : 'mainnet'),
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
            const tokenAccount = await getAssociatedTokenAddress(
                new PublicKey(token),
                new PublicKey(address)
            );
            const signs = await client.getSignaturesForAddress(tokenAccount, { limit: TRANSACTIONS_LENGTH });

            const transactions = await Promise.all(signs.map(async (sign) => {
                const tx = await client.getTransaction(sign.signature, { maxSupportedTransactionVersion: 0 });
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

export type SolanaTokenTransaction = ReturnType<typeof useSolanaTokenTransactions>['data'][number];
