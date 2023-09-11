import { Address, Cell, TonClient4 } from 'ton';
import { useRawAccountTransactions } from './useRawAccountTransactions';
import BN from 'bn.js';
import { ContractMetadata } from '../metadata/Metadata';
import { JettonMasterState } from '../legacy/sync/startJettonMasterSync';


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

    if (!raw) {
        return null;
    }

    let rawTxs = raw.data.pages.flat();

    let txs = rawTxs.map<TransactionDescription>(raw => ({
        id: `${raw.lt}_${raw.hash}`,
        base: {
            lt: raw.lt,
            hash: Buffer.from(raw.hash, 'base64'),
            address: Address.parse(raw.address),
            kind: raw.inMessage ? 'in' : 'out',
            time: raw.time,
            fees: new BN(raw.fees),
            amount: new BN(raw.inMessage?.value ?? '0').sub(raw.outMessages.reduce((acc, a) => acc.add(new BN(a.value)), new BN(0))),
            body: null,
            bounced: false,
            mentioned: [],
            prev: {
                hash: raw.prevTransaction.hash,
                lt: raw.prevTransaction.lt,
            },
            seqno: 0,
            status: 'success',
        },
        icon: null,
        masterMetadata: null,
        metadata: null,
        operation: {
            address: Address.parse(raw.address),
            items: [{
                amount: new BN(0),
                decimals: 9,
                kind: 'ton'
            }],
        },
        verified: null,
    }));

    return {
        data: txs,
        next: raw.fetchNextPage,
    }
}