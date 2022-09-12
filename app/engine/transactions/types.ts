import BN from "bn.js";
import { Address } from "ton";

export type Operation = {
    
    // Operation
    address: Address | null;
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