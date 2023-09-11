import { Address, Cell, TonClient4 } from 'ton';
import { useRawAccountTransactions } from './useRawAccountTransactions';
import BN from 'bn.js';
import { ContractMetadata } from '../metadata/Metadata';
import { JettonMasterState } from '../legacy/sync/startJettonMasterSync';
import { resolveOperation } from '../transactions/resolveOperation';
import { parseWalletTransaction } from '../transactions/parseWalletTransaction';
import { useNetwork } from './useNetwork';
import { useContractMetadatas } from './basic/useContractMetadatas';
import { useJettonContents } from './basic/useJettonContents';
import { StoredContractMetadata } from '../metadata/StoredMetadata';
import { useMemo } from 'react';


export type TxBody = { type: 'comment', comment: string } | { type: 'payload', cell: Cell };

export type Transaction = {
    lt: string | null;
    fees: BN;
    amount: BN;
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
    amount: BN;
} | {
    kind: 'token',
    amount: BN;
    symbol: string,
    decimals: number | null
};


export type TransactionDescription = {
    id: string;
    base: Transaction;
    metadata: ContractMetadata | null;
    masterMetadata: JettonMasterState | null;
    operation: Operation;
    icon: string | null;
    verified: boolean | null;
};

function getJettonMasterAddressFromMetadata(metadata: StoredContractMetadata) {
    if (metadata.jettonMaster) {
        return metadata.address;
    } else if (metadata.jettonWallet?.master) {
        return metadata.jettonWallet.master;
    }
    return null;
}


export function useAccountTransactions(client: TonClient4, account: string): { data: TransactionDescription[], next: () => void, } | null {
    let raw = useRawAccountTransactions(client, account);
    const { isTestnet } = useNetwork();

    let { baseTxs, mentioned } = useMemo(() => {
        let baseTxs = raw?.data.pages.flat().map(raw => parseWalletTransaction(raw, account, isTestnet));
        let mentioned = baseTxs ? Array.from(new Set([...baseTxs?.flatMap(tx => tx.mentioned)])) : [];
        return {
            baseTxs,
            mentioned,
        }
    }, [raw]);
    const metadatas = useContractMetadatas(mentioned);
    const jettonMasters: string[] = metadatas.map(m => m.data ? getJettonMasterAddressFromMetadata(m.data) : null).filter(a => !!a) as string[];
    const jettonMasterMetadatas = useJettonContents(jettonMasters);

    let txs = useMemo(() => {
        return baseTxs?.map<TransactionDescription>((base) => {
            const metadata = metadatas.find(a => a.data?.address && a.data.address === (base.address ? base.address.toFriendly({ testOnly: isTestnet }) : undefined))?.data ?? null;
            const jettonMasterAddress = metadata ? getJettonMasterAddressFromMetadata(metadata) : null;
            const jettonMasterMetadata = jettonMasterAddress ? jettonMasterMetadatas.find(a => a.data?.address === jettonMasterAddress)?.data ?? null : null;

            const convertedMetadata: ContractMetadata | null = metadata ? {
                interfaces: [],
                jettonMaster: metadata.jettonMaster ? {
                    content: metadata.jettonMaster.content,
                    mintalbe: metadata.jettonMaster.mintable,
                    owner: metadata.jettonMaster.owner ? Address.parse(metadata.jettonMaster.owner) : null,
                    totalSupply: new BN(metadata.jettonMaster.totalSupply),
                } : undefined,
                jettonWallet: metadata.jettonWallet ? {
                    balance: new BN(metadata.jettonWallet.balance),
                    master: Address.parse(metadata.jettonWallet.master),
                    owner: Address.parse(metadata.jettonWallet.owner),
                } : undefined,
                seqno: metadata.seqno,
            } : null;

            const convertedJettonMasterMetadata: JettonMasterState | null = jettonMasterMetadata ? {
                decimals: jettonMasterMetadata.decimals ?? null,
                name: jettonMasterMetadata.name ?? null,
                symbol: jettonMasterMetadata.symbol ?? null,
                description: jettonMasterMetadata.description ?? null,
                image: jettonMasterMetadata.image ?? null,
                originalImage: jettonMasterMetadata.originalImage ?? null,
                version: jettonMasterMetadata.version ?? 0,
            } : null;

            return ({
                id: `${base.lt}_${base.hash.toString('base64')}`,
                base: base,
                icon: convertedJettonMasterMetadata?.image?.preview256 ?? null,
                masterMetadata: convertedJettonMasterMetadata,
                metadata: convertedMetadata,
                operation: resolveOperation({
                    account: base.address || Address.parse(account),
                    amount: base.amount,
                    body: base.body,
                    jettonMaster: convertedJettonMasterMetadata,
                    metadata: convertedMetadata,
                }),
                verified: null,
            });
        });
    }, [baseTxs]);

    if (!txs || !raw) {
        return null;
    }

    return {
        data: txs,
        next: () => {
            console.log('next called');
            raw!.fetchNextPage();
        },
    }
}