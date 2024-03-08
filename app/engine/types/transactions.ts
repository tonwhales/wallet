import { AccountStatus, Address, Cell, MessageRelaxed } from '@ton/core';
import { LocalizedResources } from '../../i18n/schema';
import { JettonMasterState } from '../metadata/fetchJettonMasterContent';
import { ContractMetadata } from '../metadata/Metadata';

export type StoredAddressExternal = {
    bits: number;
    data: string;
};

export type StoredMessageInfo = {
    type: 'internal';
    value: string;
    dest: string;
    src: string;
    bounced: boolean;
    bounce: boolean;
    ihrDisabled: boolean;
    createdAt: number;
    createdLt: string;
    fwdFee: string;
    ihrFee: string;
} | {
    type: 'external-in';
    dest: string;
    src: StoredAddressExternal | null;
    importFee: string;
} | {
    type: 'external-out';
    dest: StoredAddressExternal | null;
};

export type StoredStateInit = {
    splitDepth?: number | null;
    code: string | null;
    data: string | null;
    special?: { tick: boolean, tock: boolean } | null;
};

export type StoredMessage = {
    body: string,
    info: StoredMessageInfo,
    init: StoredStateInit | null,
};

export type StoredOperation = {
    address: string;
    comment?: string;
    items: StoredOperationItem[];

    // Address
    op?: { res: LocalizedResources, options?: any };
    // title?: string;
    // image?: string;

};

export type StoredOperationItem = {
    kind: 'ton'
    amount: string;
} | {
    kind: 'token',
    amount: string;
};

export type StoredTxBody = { type: 'comment', comment: string } | { type: 'payload' };

export type StoredTransaction = {
    address: string;
    lt: string;
    hash: string
    prevTransaction: {
        lt: string;
        hash: string;
    };
    time: number;
    outMessagesCount: number;
    oldStatus: AccountStatus;
    newStatus: AccountStatus;
    fees: string;
    update: {
        oldHash: string;
        newHash: string;
    };
    inMessage: StoredMessage | null;
    outMessages: StoredMessage[];
    parsed: {
        seqno: number | null;
        body: StoredTxBody | null;
        status: 'success' | 'failed' | 'pending';
        dest: string | null;
        kind: 'out' | 'in';
        amount: string;
        resolvedAddress: string;
        bounced: boolean;
        mentioned: string[];
    },
    operation: StoredOperation;
}


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
    outMessagesCount: number;
    outMessages: MessageRelaxed[];
};