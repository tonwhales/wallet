import { Address } from "@ton/core";
import { queryClient } from "../engine/clients";
import { StoredContractMetadata, StoredJettonWallet } from "../engine/metadata/StoredMetadata";
import { Queries } from "../engine/queries";
import { verifyJetton } from "../engine/hooks/jettons/useVerifyJetton";
import { JettonMasterState } from "../engine/metadata/fetchJettonMasterContent";

export function computeHintWeight(
    hint: string,
    isTestnet: boolean,
    weights: {
        scam: number;
        balance: number;
        verified: number;
    }
): number {
    try {
        const wallet = Address.parse(hint);
        const contractMeta = queryClient.getQueryData<StoredContractMetadata>(Queries.ContractMetadata(hint));
        const jettonWallet = queryClient.getQueryData<StoredJettonWallet | null>(Queries.Account(wallet.toString({ testOnly: isTestnet })).JettonWallet());
        const masterStr = contractMeta?.jettonWallet?.master ?? jettonWallet?.master ?? null;
        const masterContent = queryClient.getQueryData<JettonMasterState | null>(Queries.Jettons().MasterContent(masterStr ?? ''));

        const { verified, isSCAM } = verifyJetton({ ticker: masterContent?.symbol, master: masterStr }, isTestnet);

        let weight = 1;
        if (!!jettonWallet && !!masterContent) {
            const hasBalance = BigInt(jettonWallet.balance) > 0n;

            if (!isSCAM) {
                weight += 1;
            } else {
                weight += weights.scam;
            }

            if (hasBalance) {
                weight += 1;
            } else {
                weight += weights.balance;
            }

            if (verified) {
                weight += 2;
            } else {
                weight += weights.verified;
            }
        } else {
            weight = -100;
        }

        return weight;
    } catch {
        console.warn('Failed to compute hint weight', hint);
        return -100;
    }
}