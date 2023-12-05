import { Address } from "@ton/core";
import { tryFetchJettonMaster } from "./introspections/tryFetchJettonMaster";
import { tryFetchJettonWallet } from "./introspections/tryFetchJettonWallet";
import { tryGetJettonWallet } from "./introspections/tryGetJettonWallet";
import { ContractMetadata } from "./Metadata";
import { TonClient4 } from '@ton/ton';
import { fetchContractMetadata } from "../api/fetchContractMetadata";

export async function fetchMetadata(client: TonClient4, seqno: number, address: Address, isTestnet: boolean, useTonClient?: boolean): Promise<ContractMetadata> {

    if (!useTonClient) {
        try {
            return await fetchContractMetadata(address, isTestnet);
        } catch (e) {
            console.warn('Failed to fetch metadata from connect: ', e)
        }
    }

    let [
        jettonWallet,
        jettonMaster
    ] = await Promise.all([
        tryFetchJettonWallet(client, seqno, address),
        tryFetchJettonMaster(client, seqno, address)
    ]);

    // Check jetton wallet
    if (jettonWallet) {
        let addr = await tryGetJettonWallet(client, seqno, { master: jettonWallet.master, address: jettonWallet.owner });
        if (!addr || !addr.equals(address)) {
            jettonWallet = null;
        }
    }

    return {
        seqno,
        jettonWallet: jettonWallet ? jettonWallet : undefined,
        jettonMaster: jettonMaster ? jettonMaster : undefined
    };
}