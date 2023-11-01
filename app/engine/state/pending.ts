import { atom } from "recoil";
import { Address, Cell } from "@ton/core";

export type PendingTransactionBody =
    | { type: 'payload', cell: Cell }
    | { type: 'comment', comment: string }
    | { type: 'token', amount: bigint, master: Address }
    | { type: 'batch' };

export type PendingTransaction = {
    id: string,
    fees: bigint,
    amount: bigint,
    address: Address | null,
    seqno: number,
    body: PendingTransactionBody | null,
    time: number,
    hash: Buffer,
};

export const pendingTransactionsState = atom<PendingTransaction[]>({
    key: "pendingTransactionsState",
    default: [],
});