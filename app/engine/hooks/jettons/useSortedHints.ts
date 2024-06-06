import { useCallback, useEffect, useRef, useState } from "react";
import { useHints, useNetwork } from "..";
import { Address } from "@ton/core";
import { queryClient } from "../../clients";
import { Queries } from "../../queries";
import { StoredContractMetadata, StoredJettonWallet } from "../../metadata/StoredMetadata";
import { verifyJetton } from "./useVerifyJetton";
import { JettonMasterState } from "../../metadata/fetchJettonMasterContent";
import { useThrottledMemo } from "../../../utils/useThottledMemo";

function computeHintWeight(
    hint: string,
    isTestnet: boolean,
    weights: {
        ready: number;
        scam: number;
        balance: number;
        verified: number;
    }
): number {
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
            weight += 1;
        } else {
            weight += weights.verified;
        }
    } else {
        weight += weights.ready;
        weight += weights.verified;
    }

    return weight;
}

export type HintsFilter = 'scam' | 'balance' | 'verified' | 'ready';

function getWeights(filter?: HintsFilter[]): { ready: number, scam: number, balance: number, verified: number } {

    if (!filter) {
        return {
            ready: 0,
            scam: -1,
            balance: 0,
            verified: 0
        };
    }

    return {
        ready: filter.includes('ready') ? -4 : 0,
        scam: filter.includes('scam') ? -4 : -1,
        balance: filter.includes('balance') ? -4 : 0,
        verified: filter.includes('verified') ? -4 : 0
    };
}

export function useSortedHints(
    owner?: string,
    filter?: HintsFilter[]
): {
    hints: string[],
    refreshAllHintsWeights: () => void,
} {
    const hints = useHints(owner);
    const { isTestnet } = useNetwork();

    const filteredHints = useThrottledMemo(() => {
        return hints;
    }, [hints], 500);

    const weightedHintsRef = useRef(new Map<string, number>());
    const [weightedHints, setWeightedHints] = useState(weightedHintsRef.current);

    const getHintWeight = useCallback((hint: string) => {
        return computeHintWeight(hint, isTestnet, getWeights(filter));
    }, [isTestnet, filter]);

    const onSetWeightedHints = useCallback((next: Map<string, number>) => {
        weightedHintsRef.current = next;
        setWeightedHints(next);
    }, []);

    const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
    const refreshAllHintsWeights = useCallback(() => {
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
        }

        updateTimerRef.current = setTimeout(() => {
            const newHints = new Map<string, number>();
            weightedHintsRef.current.forEach((weight, hint) => {
                const newWeight = getHintWeight(hint);
                newHints.set(hint, newWeight);
            });
            onSetWeightedHints(newHints);
        }, 150);
    }, [getHintWeight]);

    useEffect(() => {
        const next = new Map<string, number>();

        filteredHints.forEach((hint) => {
            const weight = getHintWeight(hint);
            next.set(hint, weight);
        });

        onSetWeightedHints(next);

    }, [filteredHints, getHintWeight]);

    const throttledHints = useThrottledMemo(() => {
        return Array.from(weightedHints.entries()).sort((a, b) => {
            if (a[1] === b[1]) {
                return 0;
            }

            return a[1] > b[1] ? -1 : 1;
        }).filter(([, wieght]) => wieght >= 0).map(([hint]) => hint);
    }, [weightedHints], 500);

    return { hints: throttledHints, refreshAllHintsWeights };
}