import { Address } from '@ton/core';
import { ContractMetadata } from '../../metadata/Metadata';
import { StoredContractMetadata } from '../../metadata/StoredMetadata';

export function getJettonMasterAddressFromMetadata(metadata: StoredContractMetadata | null) {
    if (metadata?.jettonMaster) {
        return metadata.address;
    } else if (metadata?.jettonWallet?.master) {
        return metadata.jettonWallet.master;
    }
    return null;
}

export function parseStoredMetadata(metadata: StoredContractMetadata): ContractMetadata {
    return {
        jettonMaster: metadata.jettonMaster ? {
            content: metadata.jettonMaster.content,
            mintalbe: metadata.jettonMaster.mintable,
            owner: metadata.jettonMaster.owner ? Address.parse(metadata.jettonMaster.owner) : null,
            totalSupply: BigInt(metadata.jettonMaster.totalSupply),
        } : undefined,
        jettonWallet: metadata.jettonWallet ? {
            balance: BigInt(metadata.jettonWallet.balance),
            master: Address.parse(metadata.jettonWallet.master),
            owner: Address.parse(metadata.jettonWallet.owner),
            address: Address.parse(metadata.jettonWallet.address),
        } : undefined,
        seqno: metadata.seqno,
    };
}