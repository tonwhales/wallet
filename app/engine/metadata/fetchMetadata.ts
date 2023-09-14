import { Address, TonClient4 } from "ton";
import { tryFetchJettonMaster } from "./introspections/tryFetchJettonMaster";
import { tryFetchJettonWallet } from "./introspections/tryFetchJettonWallet";
import { tryGetJettonWallet } from "./introspections/tryGetJettonWallet";
import { ContractMetadata } from "./Metadata";
import { InteractionManager } from 'react-native';

export async function fetchMetadata(client: TonClient4, seqno: number, address: Address): Promise<ContractMetadata> {
    return await InteractionManager.runAfterInteractions(async () => {
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
    });
}