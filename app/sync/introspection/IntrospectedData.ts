import BN from "bn.js";
import { Address } from "ton"

export type IntrospectedJetton = {
    balance: BN,
    owner: Address,
    master: Address
};

export type IntrospectedJettonMaster = {
    totalSupply: BN;
    mintalbe: boolean;
    owner: Address;
    content: IntrospectedContentSource | null;
}

export type IntrospectedContentSource = {
    type: 'offchain',
    link: string
}

export type IntrospectedContent = {
    name: string | null;
    symbol: string | null;
    description: string | null;
    image: string | null;
};

export type IntrospectedData = {
    interfases: string[],
    token: IntrospectedJettonMaster | null;
}