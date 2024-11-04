import { Address } from '@ton/core';
import { useRawAccountTransactions } from './useRawAccountTransactions';
import { ContractMetadata } from '../../metadata/Metadata';
import { StoredContractMetadata } from '../../metadata/StoredMetadata';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TransactionDescription } from '../../types';

export function getJettonMasterAddressFromMetadata(metadata: StoredContractMetadata | null) {
    if (metadata?.jettonMaster) {
        return metadata.address;
    } else if (metadata?.jettonWallet?.master) {
        return metadata.jettonWallet.master;
    }
    return null;
}

export function parseStoredMetadata(metadata: StoredContractMetadata): ContractMetadata {
    return {
        jettonMaster: metadata.jettonMaster ? {
            content: metadata.jettonMaster.content,
            mintalbe: metadata.jettonMaster.mintable,
            owner: metadata.jettonMaster.owner ? Address.parse(metadata.jettonMaster.owner) : null,
            totalSupply: BigInt(metadata.jettonMaster.totalSupply),
        } : undefined,
        jettonWallet: metadata.jettonWallet ? {
            balance: BigInt(metadata.jettonWallet.balance),
            master: Address.parse(metadata.jettonWallet.master),
            owner: Address.parse(metadata.jettonWallet.owner),
            address: Address.parse(metadata.jettonWallet.address),
        } : undefined,
        seqno: metadata.seqno,
    };
}

export function useAccountTransactions(account: string, options: { refetchOnMount: boolean } = { refetchOnMount: false }): {
    data: TransactionDescription[] | null,
    next: () => void,
    hasNext: boolean,
    loading: boolean,
    refresh: () => void,
    refreshing: boolean
} {
    const raw = useRawAccountTransactions(account, options);
    let baseTxs = useMemo(() => {
        return raw.data?.pages.flat();
    }, [raw.data?.pages]);

    let txs = useMemo(() => {
        return baseTxs?.map<TransactionDescription>((base) => {
            return ({
                id: `${base.lt}_${base.hash}`,
                base: base,
                verified: null,
                op: null,
                title: null,
                outMessagesCount: base.outMessagesCount,
                outMessages: base.outMessages,
            });
        }) || null;
    }, [baseTxs]);

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

    return {
        data: txs,
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