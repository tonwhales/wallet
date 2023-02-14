import BN from "bn.js";
import { mixed } from 'io-ts';
import { Address } from "ton"

export type JettonWallet = {
    balance: BN,
    owner: Address,
    master: Address
};

export type JettonMaster = {
    totalSupply: BN;
    mintalbe: boolean;
    owner: Address;
    content: ContentSource | undefined;
}

export type Lockup = {
    seqno: number;
    subwalletId: number;
    publicKey: Buffer;
    configPublicKey: Buffer;
    allowedDestinations: Address[];
    totalLockedValue: BN;
    locked: Map<string, BN> | null;
    totalRestrictedValue: BN;
    restricted: Map<string, BN> | null;
}

export type ContentSource = {
    type: 'offchain',
    link: string
} | { type: 'onchain' }

export type ContractContent = {
    name: string | undefined;
    symbol: string | undefined;
    description: string | undefined;
    image: string | undefined;
};

export type ContractMetadata = {
    seqno: number,
    interfaces: string[],
    jettonMaster: JettonMaster | undefined;
    jettonWallet: JettonWallet | undefined;
    lockup: Lockup | undefined;
}