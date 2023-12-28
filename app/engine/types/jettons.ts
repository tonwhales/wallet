import { Address } from '@ton/core';

export type Jetton = {
    master: Address;
    wallet: Address;
    name: string;
    description: string;
    symbol: string;
    balance: bigint;
    icon: string | null;
    decimals: number | null;
    disabled?: boolean;
};
