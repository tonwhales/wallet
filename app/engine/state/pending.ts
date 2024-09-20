import { atomFamily } from "recoil";
import { Address, Cell } from "@ton/core";
import { Jetton } from "../types";
import { TransferEstimate } from "../../fragments/secure/TransferFragment";

export type PendingTransactionBody =
    | { type: 'payload', cell: Cell, stateInit?: Cell | null }
    | { type: 'comment', comment: string }
    | {
        type: 'token',
        amount: bigint,
        jetton: Jetton,
        target: Address,
        bounceable?: boolean,
        comment: string | null
    }
    | { type: 'batch' };

export type PendingTransactionStatus = 'pending' | 'sent' | 'timed-out';

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

export const pendingTransactionsState = atomFamily<PendingTransaction[], string>({
    key: "pendingTransactionsState",
    default: (address) => [],
});