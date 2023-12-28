import BN from "bn.js";
import { Address } from "@ton/core";

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