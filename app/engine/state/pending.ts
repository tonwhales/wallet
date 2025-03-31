import { atomFamily } from "recoil";
import { Address, Cell, ExtraCurrency } from "@ton/core";
import { Jetton } from "../types";
import { parseBody } from "../transactions/parseWalletTransaction";
import { TransferEstimate } from "../../fragments/secure/transfer/TransferFragment";
import { Blockhash } from "@solana/web3.js";
import { ParsedTransactionInstruction } from "../../utils/solana/parseInstructions";

export type PendingTransactionBody =
    | { type: 'payload', cell: Cell, stateInit?: Cell | null, extraCurrency?: { [k: number]: bigint } }
    | { type: 'comment', comment: string, extraCurrency?: { [k: number]: bigint } }
    | {
        type: 'token',
        amount: bigint,
        jetton: Jetton,
        target: Address,
        bounceable?: boolean,
        comment: string | null,
        extraCurrency?: { [k: number]: bigint }
    }
    | {
        type: 'extra-currency',
        extraCurrency: ExtraCurrency,
    }
    | { type: 'batch' };

export enum PendingTransactionStatus {
    Pending = 'pending',
    Sent = 'sent',
    TimedOut = 'timed-out'
};

export type PendingTransaction = {
    id: string,
    fees: TransferEstimate | bigint,
    amount: bigint,
    address: Address | null,
    bounceable?: boolean,
    seqno: number,
    blockSeqno: number,
    body: PendingTransactionBody | null,
    time: number,
    hash: Buffer,
    status: PendingTransactionStatus
};

type LedgerJettonTransferPayload = {
    type: 'jetton-transfer',
    queryId: bigint | null,
    amount: bigint,
    destination: Address,
    responseDestination: Address,
    customPayload: Cell | null,
    forwardAmount: bigint,
    forwardPayload: Cell | null,
    bounceable?: boolean,
    jetton: Jetton
}

type LedgerCommentPayload = {
    type: 'comment';
    text: string;
}

export type LedgerTransferPayload = LedgerCommentPayload | LedgerJettonTransferPayload;

export function ledgerOrderToPendingTransactionBody(payload: LedgerTransferPayload | null): PendingTransactionBody | null {
    if (!payload) {
        return null;
    }

    if (payload.type === 'comment') {
        return { type: 'comment', comment: payload.text };
    }

    if (payload.type === 'jetton-transfer') {
        let comment: string | null = null;

        if (payload.forwardPayload) {
            const body = parseBody(payload.forwardPayload);
            if (body && body.type === 'comment') {
                comment = body.comment;
            }
        }

        return {
            type: 'token',
            amount: payload.amount,
            jetton: payload.jetton,
            target: payload.destination,
            bounceable: payload.bounceable,
            comment
        };
    }

    // TODO: add nft transfer support

    return null;
}

export const pendingTransactionsState = atomFamily<PendingTransaction[], string>({
    key: "pendingTransactionsState",
    default: (address) => [],
});

export type PendingSolanaTransactionInstructions = {
    type: 'instructions',
    id: string,
    time: number,
    status: PendingTransactionStatus,
    lastBlockHash: {
        blockhash: Blockhash,
        lastValidBlockHeight: number
    },
    instructions: ParsedTransactionInstruction[]
} 

export type PendingSolanaTransactionTx = {
    type: 'tx',
    id: string,
    time: number,
    status: PendingTransactionStatus,
    lastBlockHash: {
        blockhash: Blockhash,
        lastValidBlockHeight: number
    },
    tx: {
        comment?: string | null,
        amount: bigint,
        token: {
            mint: string,
            symbol: string,
            decimals: number
        } | null | undefined,
        target: string,
        sender: string
    },
}

export type PendingSolanaTransaction = PendingSolanaTransactionInstructions | PendingSolanaTransactionTx;

export const pendingSolanaTransactionsState = atomFamily<PendingSolanaTransaction[], string>({
    key: "pendingSolanaTransactionsState",
    default: (address) => [],
});