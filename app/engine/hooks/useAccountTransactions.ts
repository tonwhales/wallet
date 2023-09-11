import { Address, Cell, TonClient4 } from 'ton';
import { useRawAccountTransactions } from './useRawAccountTransactions';
import BN from 'bn.js';
import { ContractMetadata } from '../metadata/Metadata';
import { JettonMasterState } from '../legacy/sync/startJettonMasterSync';
import { resolveOperation } from '../transactions/resolveOperation';
import { parseWalletTransaction } from '../transactions/parseWalletTransaction';
import { useNetwork } from './useNetwork';


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


export function useAccountTransactions(client: TonClient4, account: string): { data: TransactionDescription[], next: () => void, } | null {
    let raw = useRawAccountTransactions(client, account);
    const { isTestnet } = useNetwork();

    if (!raw) {
        return null;
    }

    let rawTxs = raw.data.pages.flat();

    let txs = rawTxs.map<TransactionDescription>(raw => {
        const base = parseWalletTransaction(raw, account, isTestnet);
        return ({
            id: `${raw.lt}_${raw.hash}`,
            base: base,
            icon: null,
            masterMetadata: null,
            metadata: null,
            operation: resolveOperation({
                account: base.address || Address.parse(account),
                amount: base.amount,
                body: base.body,
                jettonMaster: null,
                metadata: null,
            }),
            verified: null,
        });
    });

    return {
        data: txs,
        next: raw.fetchNextPage,
    }
}