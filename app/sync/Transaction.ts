import BN from "bn.js";
import { Address } from "ton";

export type Body = { comment: string };

export type Transaction = {
    fees: BN;
    amount: BN;
    address: Address | null;
    seqno: number | null;
    kind: 'out' | 'in';
    body: Body | null;
    status: 'success' | 'failed' | 'pending';
    time: number;
}