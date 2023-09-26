import { Address } from "@ton/core"

export type JettonWallet = {
    balance: bigint,
    owner: Address,
    master: Address
};

export type JettonMaster = {
    totalSupply: bigint;
    mintalbe: boolean;
    owner: Address | null;
    content: ContentSource | undefined;
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
    jettonMaster: JettonMaster | undefined;
    jettonWallet: JettonWallet | undefined;
}