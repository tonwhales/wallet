import { Address } from '@ton/core';
import { LPAssetMetadata } from '../metadata/fetchJettonMasterContent';

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
    assets?: [LPAssetMetadata, LPAssetMetadata] | null,
    pool?: 'dedust' | 'ston-fi' | null
};
