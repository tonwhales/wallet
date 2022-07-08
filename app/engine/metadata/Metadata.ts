import BN from "bn.js";
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

export type ContentSource = {
    type: 'offchain' | 'onchain',
    link?: string,
    onchainContent?: ContractContent
}

export type ContractContent = {
    name: string | null;
    symbol: string | null;
    description: string | null;
    image: string | null;
};

export type ContractMetadata = {
    seqno: number,
    interfaces: string[],
    jettonMaster: JettonMaster | undefined;
    jettonWallet: JettonWallet | undefined;
}