import { DependencyList, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHints, useNetwork } from "..";
import { Address } from "@ton/core";
import { queryClient } from "../../clients";
import { Queries } from "../../queries";
import { StoredContractMetadata, StoredJettonWallet } from "../../metadata/StoredMetadata";
import { verifyJetton } from "./useVerifyJetton";
import { JettonMasterState } from "../../metadata/fetchJettonMasterContent";

function useThrottledMemo<T>(
    factory: () => T, deps: DependencyList | undefined,
    throttle: number = 1000
): T {
    const [value, setValue] = useState<T>(factory());
    useEffect(() => {
        const timer = setTimeout(() => setValue(factory()), throttle);
        return () => clearTimeout(timer);
    }, deps);
    return value;
}

function computeHintWeight(
    hint: string,
    isTestnet: boolean,
    weights: {
        loaded: number;
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

    let weight = 0;
    if (!!jettonWallet && !!masterContent) {

        weight = weights.loaded;

        if (isSCAM) {
            weight += weights.scam;
        }

        const hasBalance = BigInt(jettonWallet.balance) > 0n;
        if (hasBalance) {
            weight += weights.balance;
        }

        if (verified) {
            weight += weights.verified;
        }
    }

    return weight;
}

const weights = {
    loaded: 1,
    scam: -1,
    balance: 1,
    verified: 1
};

export function useSortedHints(
    owner?: string,
    filterFn?: (hint: string) => boolean,
): {
    hints: string[],
    setHintWeight: (hint: string, weight: number) => void,
    updateAllHints: (updater: (hint: string, prevWeight?: number) => number) => void,
    refreshHintWeight: (hint: string) => void,
    refreshAllHintWeights: () => void,
} {
    const hints = useHints(owner);
    const { isTestnet } = useNetwork();

    const filteredHints = useMemo(() => {
        if (!filterFn) {
            return hints;
        }

        return hints.filter(filterFn);
    }, [hints, filterFn]);

    const weightedHintsRef = useRef(new Map<string, number>());
    const [weightedHints, setWeightedHints] = useState(weightedHintsRef.current);

    const getHintWeight = useCallback((hint: string) => {
        return computeHintWeight(hint, isTestnet, weights);
    }, [isTestnet]);

    useEffect(() => {
        console.log('Updating hint weights');
        const next = new Map<string, number>();

        filteredHints.forEach((hint) => {
            const weight = getHintWeight(hint);
            next.set(hint, weight);
        });

        weightedHintsRef.current = next;
        setWeightedHints(next);

    }, [filteredHints, getHintWeight]);

    const updateAllHints = useCallback((updater: (hint: string, prevWeight?: number) => number) => {
        console.log('Updating all hint weights');
        const newHints = new Map<string, number>();
        weightedHintsRef.current.forEach((weight, hint) => {
            newHints.set(hint, updater(hint, weight));
        });
        weightedHintsRef.current = newHints;
        setWeightedHints(weightedHintsRef.current);
    }, []);

    const setHintWeight = useCallback((hint: string, weight: number) => {
        console.log('Setting hint weight');
        weightedHintsRef.current.set(hint, weight);
        setWeightedHints(weightedHintsRef.current);
    }, []);

    const refreshHintWeight = useCallback((hint: string) => {
        console.log('Refreshing hint weight');
        const weight = getHintWeight(hint);
        weightedHintsRef.current.set(hint, weight);
        setWeightedHints(weightedHintsRef.current);
        return weight;
    }, [isTestnet, getHintWeight]);

    const refreshAllHintWeights = useCallback(() => {
        console.log('Refreshing all hint weights');
        const newHints = new Map<string, number>();
        weightedHintsRef.current.forEach((weight, hint) => {
            const newWeight = getHintWeight(hint);
            newHints.set(hint, newWeight);
        });
        weightedHintsRef.current = newHints;
        setWeightedHints(weightedHintsRef.current);
    }, [getHintWeight]);

    const throttledHints = useThrottledMemo(() => {
        return Array.from(weightedHints.entries()).sort((a, b) => {
            if (a[1] === b[1]) {
                return 0;
            }

            return a[1] > b[1] ? -1 : 1;
        }).map(([hint]) => hint);
    }, [weightedHints], 1000);

    return { hints: throttledHints, setHintWeight, updateAllHints, refreshHintWeight, refreshAllHintWeights };
}