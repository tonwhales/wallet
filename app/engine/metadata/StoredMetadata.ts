export type StoredJettonWallet = {
    balance: string,
    owner: string,
    master: string,
    address: string,
};

export type StoredJettonMaster = {
    totalSupply: string;
    mintable: boolean;
    owner: string | null;
    content: StoredContentSource | undefined;
}

export type StoredContentSource = {
    type: 'offchain',
    link: string
} | { type: 'onchain' }

export type StoredContractContent = {
    name: string | undefined;
    symbol: string | undefined;
    description: string | undefined;
    image: string | undefined;
};

export type StoredContractMetadata = {
    seqno: number,
    jettonMaster: StoredJettonMaster | null;
    jettonWallet: StoredJettonWallet | null;
    address: string;
}