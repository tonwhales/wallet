import { Address } from "@ton/core";
import { queryClient } from "../../engine/clients";
import { StoredContractMetadata, StoredJettonWallet } from "../../engine/metadata/StoredMetadata";
import { Queries } from "../../engine/queries";
import { verifyJetton } from "../../engine/hooks/jettons/useVerifyJetton";
import { JettonMasterState } from "../../engine/metadata/fetchJettonMasterContent";
import { getQueryData } from "../../engine/utils/getQueryData";
import { QueryCache } from "@tanstack/react-query";
import { jettonMasterContentQueryFn, jettonWalletQueryFn } from "../../engine/hooks/jettons/jettonsBatcher";
import { MintlessJetton } from "../../engine/api/fetchMintlessHints";
import { calculateHintRateNum } from "./calculateHintRateNum";
import { JettonFull } from "../../engine/api/fetchHintsFull";

type Hint = {
    address: string,
    loaded?: boolean;
    rate?: number | null;
    verified?: boolean;
    isSCAM?: boolean;
    balance?: bigint;
};

export type HintsFilter = 'scam' | 'balance' | 'verified';

export function getHintWeights(filter?: HintsFilter[]): { scam: number, balance: number, verified: number } {

    if (!filter) {
        return {
            scam: -1,
            balance: 0,
            verified: 0
        };
    }

    return {
        scam: filter.includes('scam') ? -4 : -1,
        balance: filter.includes('balance') ? -4 : 0,
        verified: filter.includes('verified') ? -4 : 0
    };
}

export function filterHint(filter: HintsFilter[]): (hint: Hint) => boolean {
    return (hint: Hint) => {

        if (!hint.loaded) {
            return false;
        }

        if (filter.includes('verified') && !hint.verified) {
            return false;
        }

        if (filter.includes('scam') && hint.isSCAM) {
            return false;
        }

        if (filter.includes('balance') && hint.balance === 0n) {
            return false;
        }

        return true;
    }
}

export function getHintFull(jetton: JettonFull, isTestnet: boolean): Hint {
    const { verified, isSCAM } = verifyJetton({ ticker: jetton.jetton.symbol, master: jetton.jetton.address }, isTestnet);    
    const decimals = jetton.jetton.decimals ?? 9;
    const usdRate = jetton.price?.prices?.['USD'];
    const rate = usdRate? calculateHintRateNum(BigInt(jetton.balance), usdRate, decimals): undefined;

    return { address: jetton.walletAddress.address, rate, verified, isSCAM, balance: BigInt(jetton.balance), loaded: true };
}

export function getHint(queryCache: QueryCache, hint: string, isTestnet: boolean): Hint {
    try {
        const wallet = Address.parse(hint);
        const contractMeta = getQueryData<StoredContractMetadata>(queryCache, Queries.ContractMetadata(hint));
        const jettonWallet = getQueryData<StoredJettonWallet | null>(queryCache, Queries.Account(wallet.toString({ testOnly: isTestnet })).JettonWallet());
        const masterStr = contractMeta?.jettonWallet?.master ?? jettonWallet?.master ?? '';
        const masterContent = getQueryData<JettonMasterState | null>(queryCache, Queries.Jettons().MasterContent(masterStr));
        const rates = getQueryData<Record<string, number> | null | undefined>(queryCache, Queries.Jettons().Rates(masterStr));

        const { verified, isSCAM } = verifyJetton({ ticker: masterContent?.symbol, master: masterStr }, isTestnet);

        if (!jettonWallet || !masterContent) {
            // prefetch jetton wallet & master content
            queryClient.prefetchQuery({
                queryKey: Queries.Account(wallet.toString({ testOnly: isTestnet })).JettonWallet(),
                queryFn: jettonWalletQueryFn(wallet.toString({ testOnly: isTestnet }), isTestnet)
            });
            queryClient.prefetchQuery({
                queryKey: Queries.Jettons().MasterContent(masterStr),
                queryFn: jettonMasterContentQueryFn(masterStr, isTestnet)
            });
            return { address: hint };
        }

        const decimals = masterContent.decimals ?? 9;
        const usdRate = rates?.['USD'];
        const rate = usdRate? calculateHintRateNum(BigInt(jettonWallet.balance), usdRate, decimals): undefined;

        return { address: hint, rate, verified, isSCAM, balance: BigInt(jettonWallet.balance), loaded: true };
    } catch {
        return { address: hint };
    }
}

export function getMintlessHint(queryCache: QueryCache, hint: MintlessJetton, isTestnet: boolean): Hint {
    try {
        const masterStr = hint.jetton.address;
        const masterContent = getQueryData<JettonMasterState | null>(queryCache, Queries.Jettons().MasterContent(masterStr));
        const rates = getQueryData<Record<string, number> | null | undefined>(queryCache, Queries.Jettons().Rates(masterStr));

        const { verified, isSCAM } = verifyJetton({ ticker: masterContent?.symbol, master: masterStr }, isTestnet);

        if (!masterContent) {
            // prefetch master content
            queryClient.prefetchQuery({
                queryKey: Queries.Jettons().MasterContent(masterStr),
                queryFn: jettonMasterContentQueryFn(masterStr, isTestnet)
            });
            return { address: hint.walletAddress.address };
        }

        const decimals = masterContent.decimals ?? 9;
        const usdRate = rates?.['USD'];
        const rate = usdRate? calculateHintRateNum(BigInt(hint.balance), usdRate, decimals): undefined;

        return { address: hint.walletAddress.address, rate, verified, isSCAM, balance: BigInt(hint.balance), loaded: true };
    } catch {
        return { address: hint.jetton.address };
    }
}

export function isMintlessJetton(queryCache: QueryCache, address: string) {
    const mintlessHints = getQueryData<MintlessJetton[]>(queryCache, Queries.Mintless(address));
    return mintlessHints?.some(hint => {
        try {
            return Address.parse(hint.walletAddress.address).equals(Address.parse(address));
        } catch {
            return false;
        }
    }) ?? false;
}

export function compareHints(a: Hint, b: Hint): number {
    if (!a && !b) {
        return 0;
    }

    if (!a) {
        return 1;
    }

    if (!b) {
        return -1;
    }

    let weightA = a.verified ? 1 : 0;
    let weightB = b.verified ? 1 : 0;

    if (a.isSCAM) {
        weightA -= 1;
    }

    if (b.isSCAM) {
        weightB -= 1;
    }

    if (!!a.balance && a.balance > 0n) {
        weightA += 1;
    }

    if (!!b.balance && b.balance > 0n) {
        weightB += 1;
    }

    if (a.rate && b.rate) {
        weightA += 1;
        weightB += 1;

        if (a.rate > b.rate) {
            weightA += 2;
        } else {
            weightB += 2;
        }

    } else if (a.rate) {
        weightA += 2;
    } else if (b.rate) {
        weightB += 2;
    }

    if (!a.balance || a.balance === 0n) {
        weightA -= 3;
    }
    if (!b.balance || b.balance === 0n) {
        weightB -= 3;
    }

    const diff = weightB - weightA;

    return diff > 0 ? 1 : -1;
}