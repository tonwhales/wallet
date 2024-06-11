import { Address, fromNano } from "@ton/core";
import { queryClient } from "../engine/clients";
import { StoredContractMetadata, StoredJettonWallet } from "../engine/metadata/StoredMetadata";
import { Queries } from "../engine/queries";
import { verifyJetton } from "../engine/hooks/jettons/useVerifyJetton";
import { JettonMasterState } from "../engine/metadata/fetchJettonMasterContent";
import { getQueryData } from "../engine/utils/getQueryData";

type Hint = {
    address: string,
    swap?: bigint | null;
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

export function getHint(hint: string, isTestnet: boolean): Hint {
    try {
        const wallet = Address.parse(hint);
        const queryCache = queryClient.getQueryCache();
        const contractMeta = getQueryData<StoredContractMetadata>(queryCache, Queries.ContractMetadata(hint));
        const jettonWallet = getQueryData<StoredJettonWallet | null>(queryCache, Queries.Account(wallet.toString({ testOnly: isTestnet })).JettonWallet());
        const masterStr = contractMeta?.jettonWallet?.master ?? jettonWallet?.master ?? null;
        const masterContent = getQueryData<JettonMasterState | null>(queryCache, Queries.Jettons().MasterContent(masterStr ?? ''));
        const swap = getQueryData<bigint | null | undefined>(queryCache, Queries.Jettons().Swap(masterStr ?? ''));

        const { verified, isSCAM } = verifyJetton({ ticker: masterContent?.symbol, master: masterStr }, isTestnet);

        if (!jettonWallet || !masterContent) {
            return { address: hint };
        }

        return { address: hint, swap, verified, isSCAM, balance: BigInt(jettonWallet.balance) };
    } catch {
        return { address: hint };
    }
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

    let weightA = a.verified ? 2 : 0;
    let weightB = b.verified ? 2 : 0;

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

    const diff = weightB - weightA;
    if (diff === 0) {
        if (a.swap && b.swap) {
            const aSwapAmount = Number(fromNano(a.swap)) * Number(fromNano(a.balance ?? 0n));
            const bSwapAmount = Number(fromNano(b.swap)) * Number(fromNano(b.balance ?? 0n));
            return bSwapAmount > aSwapAmount ? 1 : -1;
        }

        if (a.swap) {
            return -1;
        }

        if (b.swap) {
            return 1;
        }
    }

    return diff > 0 ? 1 : -1;
}