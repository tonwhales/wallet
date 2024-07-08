import { Address } from "@ton/core";
import { useRawAccountTransactions } from ".";
import { StoredTransaction, TransactionDescription } from "../../types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { throttle } from "../../../utils/throttle";
import { useContractMetadatas, useJettonContents } from "..";
import { ContractMetadata } from "../../metadata/Metadata";
import { getJettonMasterAddressFromMetadata, parseStoredMetadata } from "./useAccountTransactions";
import { queryClient } from "../../clients";
import { getQueryData } from "../../utils/getQueryData";
import { Queries } from "../../queries";
import { contractMetadataQueryFn } from "../jettons/usePrefetchHints";

function useAccTxs(account: string, isTestnet: boolean, options?: { refetchOnMount: boolean }) {
    const processedMentions = useRef(new Set<string>());
    const query = useRawAccountTransactions(account, options);

    // prefetch contract metadata for mentioned addresses
    // to allow better performance on txs history tab
    useEffect(() => {
        if (query.data?.pages.length === 0) {
            return;
        }

        const queryCache = queryClient.getQueryCache();
        const flat = (query.data?.pages.flat() ?? []).filter(tx => !!tx) as StoredTransaction[];
        const mentioned = Array.from(new Set([...flat.flatMap(tx => tx.parsed.mentioned)]));

        mentioned.forEach(m => {
            if (processedMentions.current.has(m)) {
                return;
            }
            if (!getQueryData(queryCache, Queries.ContractMetadata(m))) {
                queryClient.prefetchQuery(
                    {
                        queryKey: Queries.ContractMetadata(m),
                        queryFn: contractMetadataQueryFn(isTestnet, m)
                    }
                );
                processedMentions.current.add(m);
            }
        });

    }, [query.data?.pages.length]);

    const res = useMemo(() => {
        return {
            hasNext: !!query.hasNextPage,
            next: query.fetchNextPage,
            data: query.data?.pages.flat(),
            loading: query.isFetching || query.isFetchingNextPage
        }
    }, [query.data?.pages.length, query.isFetching, query.isFetchingNextPage, query.hasNextPage]);

    return res;
}

export function useJettonWalletTransactios(
    owner: string,
    wallet: string,
    isTestnet: boolean,
    options: { refetchOnMount: boolean } = { refetchOnMount: false }
): {
    data: TransactionDescription[] | null,
    next: () => void,
    hasNext: boolean,
    loading: boolean,
    progress: number,
} {
    const walletTxsQuery = useAccTxs(wallet, isTestnet, options), ownerTxsQuery = useAccTxs(owner, isTestnet, options);
    const walletTransactions = walletTxsQuery?.data, ownerTransactions = ownerTxsQuery?.data;
    const ownerLoading = ownerTxsQuery.loading, ownerHasNext = ownerTxsQuery.hasNext;
    const walletLoading = walletTxsQuery.loading, walletHasNext = walletTxsQuery.hasNext

    // jetton wallet transactions that are related to owner
    const walletTxs = useMemo(() => {
        return walletTransactions?.filter(tx => {
            if (tx.inMessage?.info.type !== 'internal') {
                return false;
            }
            return Address.parse(tx.inMessage.info.dest as string).equals(Address.parse(wallet))
                || Address.parse(tx.inMessage.info.src as string).equals(Address.parse(owner));
        })
    }, [walletTransactions?.length]);

    // owner transactions that are jetton transfers
    const ownerJettonTxs = useMemo(() => {
        return ownerTransactions?.filter(tx => {
            const info = tx.inMessage?.info;

            if (!info || info?.type === 'external-out') {
                return false;
            }

            const isToken = tx.operation.items.some((item) => item.kind === 'token');

            if (tx.address === wallet) {
                return isToken;
            }

            const inMentioned = tx.parsed.mentioned.includes(wallet);

            if (inMentioned) {
                return isToken;
            }

            return false;
        });
    }, [ownerTransactions?.length]);

    const mentioned = useMemo(() => {
        return Array.from(new Set([...(ownerJettonTxs || []).flatMap(tx => tx.parsed.mentioned)]));
    }, [ownerJettonTxs?.length]);

    const metadatas = useContractMetadatas(mentioned);

    const metadatasMap = new Map<string, { metadata: ContractMetadata, jettonMasterAddress: string | null }>();
    const jettonMasters = new Set<string>();
    for (let m of metadatas) {
        if (m.data) {
            let jettonAddress = getJettonMasterAddressFromMetadata(m.data);
            metadatasMap.set(m.data.address, {
                jettonMasterAddress: jettonAddress,
                metadata: parseStoredMetadata(m.data)
            });
            if (jettonAddress) {
                jettonMasters.add(jettonAddress);
            }
        }
    }

    const jettonMasterMetadatas = useJettonContents([...jettonMasters]);

    let txs = useMemo(() => {
        return ownerJettonTxs?.map<TransactionDescription>((base) => {
            const resolvedAddress = Address.parse(base.parsed.resolvedAddress);
            const metadata = metadatasMap.get(resolvedAddress.toString({ testOnly: isTestnet }));
            const jettonMasterAddress = metadata?.jettonMasterAddress;

            const jettonMasterMetadata = jettonMasterAddress ? jettonMasterMetadatas.find(a => a.data?.address === jettonMasterAddress)?.data ?? null : null;

            return ({
                id: `${base.lt}_${base.hash}`,
                base: base,
                icon: jettonMasterMetadata?.image?.preview256 ?? null,
                masterMetadata: jettonMasterMetadata,
                masterAddressStr: jettonMasterAddress,
                metadata: metadata ? metadata.metadata : null,
                verified: null,
                op: null,
                title: null,
                outMessagesCount: base.outMessagesCount,
                outMessages: base.outMessages,
            });
        }) || null;
    }, [ownerJettonTxs?.length, Object.keys(metadatasMap).length, jettonMasterMetadatas.length]);

    // const isLoading = ownerLoading || walletLoading;
    const [isLoading, setIsLoading] = useState(ownerLoading || walletLoading);

    const setIsLoadingState = useCallback(throttle((value: boolean) => {
        setIsLoading(value);
    }, 500), []);

    // in seconds
    let oldesSyncedOwnerTxTime = ownerTransactions?.[ownerTransactions?.length - 1]?.time || 0;
    const oldestSyncedWalletTxTime = walletTxs?.[walletTxs.length - 1]?.time || 0;

    if (oldesSyncedOwnerTxTime !== 0) {
        oldesSyncedOwnerTxTime -= 30 // 30 seconds
    }

    const shouldLoadMore = oldesSyncedOwnerTxTime > oldestSyncedWalletTxTime;

    useEffect(() => {
        setIsLoadingState(ownerLoading || walletLoading);
        if (ownerLoading || walletLoading) {
            return;
        }
        if (shouldLoadMore) {
            if (walletHasNext) {
                walletTxsQuery.next();
                return;
            }
            if ((ownerHasNext)) {
                ownerTxsQuery.next();
                return;
            }
        }
    }, [shouldLoadMore, ownerHasNext, walletHasNext, ownerLoading || walletLoading]);

    const progress = (!walletTxs || !txs) ? 0 : (txs?.length ?? 1) / (walletTxs?.length || 1);

    const result = useMemo(() => ({
        data: txs,
        next: walletTxsQuery.next,
        hasNext: walletHasNext,
        progress,
    }), [txs, walletHasNext, progress]);

    return { ...result, loading: isLoading };
}