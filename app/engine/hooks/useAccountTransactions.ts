import { Address, Cell } from '@ton/core';
import { StoredTransaction, useRawAccountTransactions } from './useRawAccountTransactions';
import BN from 'bn.js';
import { ContractMetadata } from '../metadata/Metadata';
import { useContractMetadatas } from './basic/useContractMetadatas';
import { useJettonContents } from './basic/useJettonContents';
import { StoredContractMetadata, StoredJettonMaster } from '../metadata/StoredMetadata';
import { useMemo } from 'react';
import { JettonMasterState } from '../metadata/fetchJettonMasterContent';
import { TonClient4 } from '@ton/ton';


export type TxBody = { type: 'comment', comment: string } | { type: 'payload', cell: Cell };

export type Transaction = {
    lt: string | null;
    fees: bigint;
    amount: bigint;
    address: Address | null;
    seqno: number | null;
    kind: 'out' | 'in';
    body: TxBody | null;
    status: 'success' | 'failed' | 'pending';
    time: number;
    bounced: boolean;
    prev: { lt: string, hash: string } | null;
    mentioned: string[];
    hash: Buffer;
}

export type Operation = {

    // Operation
    address: Address;
    op?: string;
    items: OperationItem[];

    // Address
    title?: string;
    image?: string;
    comment?: string;
};

export type OperationItem = {
    kind: 'ton'
    amount: bigint;
} | {
    kind: 'token',
    amount: bigint;
    symbol: string,
    decimals: number | null
};


export type TransactionDescription = {
    id: string;
    base: StoredTransaction;
    metadata: ContractMetadata | null;
    masterMetadata: JettonMasterState | null;
    icon: string | null;
    op: string | null;
    title: string | null;
    verified: boolean | null;
};

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
        } : undefined,
        seqno: metadata.seqno,
    };
}


export function useAccountTransactions(client: TonClient4, account: string): {
    data: TransactionDescription[],
    next: () => void,
    hasNext: boolean,
    loading: boolean
} | null {
    let raw = useRawAccountTransactions(client, account);

    // We should memoize to prevent recalculation if metadatas and jettons are updated
    let { baseTxs, mentioned } = useMemo(() => {
        let baseTxs = raw?.data.pages.flat();
        let mentioned = baseTxs ? Array.from(new Set([...baseTxs?.flatMap(tx => tx.parsed.mentioned)])) : [];

        return {
            baseTxs,
            mentioned,
        };
    }, [raw?.data]);

    const metadatas = useContractMetadatas(mentioned);
    const { metadatasMap, jettonMasters } = useMemo(() => {
        const metadatasMap = new Map<string, { metadata: ContractMetadata, jettonMasterAddress: string | null }>();
        const jettonMasters: string[] = [];
        for (let m of metadatas) {
            if (m.data) {
                let jettonAddress = getJettonMasterAddressFromMetadata(m.data);
                metadatasMap.set(m.data.address, {
                    jettonMasterAddress: jettonAddress,
                    metadata: parseStoredMetadata(m.data)
                });
                if (jettonAddress) {
                    jettonMasters.push(jettonAddress);
                }
            }
        }
        return {
            jettonMasters,
            metadatasMap,
        }
    }, [metadatas]);

    const jettonMasterMetadatas = useJettonContents(jettonMasters);

    let txs = useMemo(() => {
        return baseTxs?.map<TransactionDescription>((base) => {
            const metadata = metadatasMap.get(base.parsed.resolvedAddress);
            const jettonMasterAddress = metadata?.jettonMasterAddress;

            const jettonMasterMetadata = jettonMasterAddress ? jettonMasterMetadatas.find(a => a.data?.address === jettonMasterAddress)?.data ?? null : null;

            return ({
                id: `${base.lt}_${base.hash}`,
                base: base,
                icon: jettonMasterMetadata?.image?.preview256 ?? null,
                masterMetadata: jettonMasterMetadata,
                metadata: metadata ? metadata.metadata : null,
                verified: null,
                op: null,
                title: null,
            });
        })
    }, [baseTxs, metadatasMap, jettonMasterMetadatas]);

    if (!txs || !raw) {
        return null;
    }

    return {
        data: txs,
        next: () => {
            raw!.fetchNextPage();
        },
        hasNext: !!raw.hasNextPage,
        loading: raw.isFetching
    }
}