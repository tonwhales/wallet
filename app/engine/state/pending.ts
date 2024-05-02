import { atomFamily } from "recoil";
import { Address, Cell } from "@ton/core";
import { Jetton } from "../types";

export type PendingTransactionBody =
    | { type: 'payload', cell: Cell }
    | { type: 'comment', comment: string }
    | {
        type: 'token',
        amount: bigint,
        master: Jetton,
        target: Address,
        bounceable?: boolean,
        comment: string | null
    }
    | { type: 'batch' };

export type PendingTransactionStatus = 'pending' | 'sent';

export type PendingTransaction = {
    id: string,
    fees: bigint,
    amount: bigint,
    address: Address | null,
    bounceable?: boolean,
    seqno: number,
    body: PendingTransactionBody | null,
    time: number,
    hash: Buffer,
    status: PendingTransactionStatus
};

export const pendingTransactionsState = atomFamily<PendingTransaction[], string>({
    key: "pendingTransactionsState",
    default: (address) => [],
});