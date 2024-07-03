import { Address } from "@ton/core";
import { useRawAccountTransactions } from ".";
import { TransactionDescription } from "../../types";
import { useCallback, useEffect, useMemo } from "react";
import { throttle } from "../../../utils/throttle";
import { useContractMetadatas, useJettonContents } from "..";
import { ContractMetadata } from "../../metadata/Metadata";
import { getJettonMasterAddressFromMetadata, parseStoredMetadata } from "./useAccountTransactions";

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
    // TODO: fix jetton wallet re-sunc on changes
    console.log('🌚 rerender');
    const walletTxsQuery = useRawAccountTransactions(wallet, options);
    const ownerTxsQuery = useRawAccountTransactions(owner, options);

    const walletTransactions = walletTxsQuery?.data?.pages.flat();
    const ownerTransactions = ownerTxsQuery?.data?.pages.flat();

    const ownerLoading = ownerTxsQuery.isFetching || ownerTxsQuery.isFetchingNextPage;
    const ownerHasNext = !!ownerTxsQuery.hasNextPage;

    const walletLoading = walletTxsQuery.isFetching || walletTxsQuery.isFetchingNextPage;
    const walletHasNext = !!walletTxsQuery.hasNextPage;

    const toOwner = useMemo(() => {
        return walletTransactions?.filter(tx => {
            if (tx.inMessage?.info.type !== 'internal') {
                return false;
            }
            return Address.parse(tx.inMessage.info.dest as string).equals(Address.parse(wallet))
                || Address.parse(tx.inMessage.info.src as string).equals(Address.parse(owner));
        })
    }, [walletTransactions?.length]);

    const ownersJettonTxs = useMemo(() => {
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
        return Array.from(new Set([...(ownersJettonTxs || []).flatMap(tx => tx.parsed.mentioned)]));
    }, [ownersJettonTxs?.length]);

    const metadatas = useContractMetadatas(mentioned);

    const { metadatasMap, jettonMasters } = useMemo(() => {
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
        return {
            jettonMasters,
            metadatasMap,
        }
    }, [metadatas]);

    const jettonMasterMetadatas = useJettonContents([...jettonMasters]);

    let txs = useMemo(() => {
        return ownersJettonTxs?.map<TransactionDescription>((base) => {
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
    }, [ownersJettonTxs?.length, metadatasMap, jettonMasterMetadatas]);

    const isLoading = ownerLoading || walletLoading;

    // in seconds
    let oldesSyncedOwnerTxTime = ownerTransactions?.[ownerTransactions?.length - 1]?.time || 0;
    const oldestSyncedWalletTxTime = toOwner?.[toOwner.length - 1]?.time || 0;

    if (oldesSyncedOwnerTxTime !== 0) {
        oldesSyncedOwnerTxTime -= 60 // 1 minute
    }

    const outOfSync = oldesSyncedOwnerTxTime > oldestSyncedWalletTxTime;

    const throttledOwnerNext = useCallback(throttle(() => {
        console.log('Fetching next page for owner');
        ownerTxsQuery.fetchNextPage();
    }, 100), []);

    const throttledWalletNext = useCallback(throttle(() => {
        console.log('Fetching next page for wallet');
        walletTxsQuery.fetchNextPage();
    }, 100), []);

    useEffect(() => {
        if (isLoading) {
            return;
        }
        if (outOfSync) {
            if (walletHasNext) {
                throttledWalletNext();
                return;
            }
            if ((ownerHasNext)) {
                throttledOwnerNext();
                return;
            }
        }
    }, [outOfSync, ownerHasNext, walletHasNext, isLoading]);

    const progress = (!toOwner || !txs) ? 0 : (txs?.length ?? 1) / (toOwner?.length || 1);

    return {
        progress,
        data: txs,
        next: () => {
            if (walletHasNext && !isLoading) {
                walletTxsQuery.fetchNextPage();
            }
        },
        hasNext: walletHasNext,
        loading: isLoading && outOfSync
    };

}