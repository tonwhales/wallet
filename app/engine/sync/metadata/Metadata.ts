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
    type: 'offchain',
    link: string
}

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
}

export type LegacySubscription = {
    wallet: Address,
    beneficiary: Address,
    amount: BN,
    period: number,
    startAt: number,
    timeout: number,
    lastPayment: number,
    lastRequest: number,
    failedAttempts: number,
    subscriptionId: string
};