import BN from "bn.js";
import { Address, Cell } from "ton";

export type Body = { type: 'comment', comment: string } | { type: 'payload', cell: Cell };

export type Transaction = {
    id: string;
    lt: string | null;
    fees: BN;
    amount: BN;
    address: Address | null;
    seqno: number | null;
    kind: 'out' | 'in';
    body: Body | null;
    status: 'success' | 'failed' | 'pending';
    time: number;
    bounced: boolean;
    prev: { lt: string, hash: string } | null;
}