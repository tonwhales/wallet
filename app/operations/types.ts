import BN from "bn.js";
import { Address } from "ton";
import { KnownWallet } from "../secure/KnownWallets";

export type Operation = {
    name: string;
    items: OperationItem[];
    address: Address;
    image?: string;
    known?: KnownWallet;
    comment?: string;
};

export type OperationItem = {
    kind: 'ton'
    amount: BN;
} | {
    kind: 'token',
    amount: BN;
    symbol: string
};