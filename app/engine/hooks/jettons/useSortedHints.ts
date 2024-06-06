import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient4, useHints, useNetwork } from "..";
import { Address } from "@ton/core";
import { queryClient } from "../../clients";
import { Queries } from "../../queries";
import { StoredContractMetadata, StoredJettonWallet } from "../../metadata/StoredMetadata";
import { verifyJetton } from "./useVerifyJetton";
import { JettonMasterState } from "../../metadata/fetchJettonMasterContent";
import { useThrottledMemo } from "../../../utils/useThottledMemo";
import { jettonWalletAddressQueryFn } from "./useJettonWalletAddress";
import { QueryCacheNotifyEvent } from "@tanstack/react-query";

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

function checkIfArrysEqualByContent<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        const aItem = a[i];
        if (!b.includes(aItem)) {
            return false;
        }
    }

    return true;
}

function useSubToHintChange(
    onChangeMany: (hints: string[]) => void,
    owner: string,
) {
    let isTestnet = useNetwork().isTestnet;
    let client = useClient4(isTestnet);

    const toUdateRef = useRef<string[]>([]);
    const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resetUpdateTimer = useCallback((callback: () => void, ms?: number | undefined) => {
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
            updateTimerRef.current = null;
        }

        updateTimerRef.current = setTimeout(callback, ms);
    }, []);

    const addHintToUpdate = useCallback((hint: string) => {
        if (!toUdateRef.current.includes(hint)) {
            toUdateRef.current.push(hint);
        }

        resetUpdateTimer(() => {
            const toUpdate = toUdateRef.current;
            onChangeMany(toUpdate);
            toUdateRef.current = [];
        }, 1000);
    }, []);

    useEffect(() => {
        const unsub = queryClient.getQueryCache().subscribe((e: QueryCacheNotifyEvent) => {
            if (e.type === 'observerResultsUpdated' || e.type === 'updated') {
                const queryKey = e.query.queryKey;

                if (queryKey[0] === 'contractMetadata') {
                    const hint = queryKey[1];
                    addHintToUpdate(hint);
                }

                if (queryKey[0] === 'account' && queryKey[2] === 'jettonWallet') {
                    const hint = queryKey[1];
                    addHintToUpdate(hint);
                }

                if (queryKey[0] === 'jettons' && queryKey[1] === 'master' && queryKey[3] === 'content') {
                    const master = queryKey[2];

                    // fetch jetton wallet address
                    (async () => {
                        const jettonWalletAddressCache = queryClient.getQueryData<string | null>(Queries.Jettons().Address(master).Wallet(owner));

                        if (jettonWalletAddressCache) {
                            addHintToUpdate(jettonWalletAddressCache);
                        } else {
                            try {
                                const res = await queryClient.fetchQuery({
                                    queryKey: Queries.Jettons().Address(master).Wallet(owner),
                                    queryFn: jettonWalletAddressQueryFn(client, master, owner, isTestnet)
                                });

                                if (res) {
                                    addHintToUpdate(res);
                                }
                            } catch {
                                console.warn(`Failed to fetch jetton wallet address owner: ${owner}, master: ${master}`);
                            }
                        }
                    })();
                }
            }
        });

        return unsub;
    }, []);
}

export function useSortedHints(
    address?: string,
    filter?: HintsFilter[]
): { hints: string[] } {
    // to avoid unnecessary re-renders on component re-mount
    const owner = useMemo(() => {
        return address;
    }, [address]);
    const hints = useHints(owner);
    const { isTestnet } = useNetwork();

    const prevHints = useRef(hints);
    const filteredHints = useThrottledMemo(() => {
        // to avoid unnecessary re-renders on hints order change
        const areEqual = checkIfArrysEqualByContent(prevHints.current, hints);

        if (!areEqual) {
            prevHints.current = hints;
        }
        return prevHints.current;
    }, [hints], 1000);

    const weightedHintsRef = useRef(new Map<string, number>());
    const [weightedHints, setWeightedHints] = useState(weightedHintsRef.current);

    const getHintWeight = useCallback((hint: string) => {
        return computeHintWeight(hint, isTestnet, getWeights(filter));
    }, [isTestnet, filter]);

    const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resetUpdateTimer = useCallback((callback: () => void, ms?: number | undefined) => {
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
            updateTimerRef.current = null;
        }

        updateTimerRef.current = setTimeout(callback, ms);
    }, []);

    const onSetWeightedHints = useCallback((next: Map<string, number>) => {
        weightedHintsRef.current = next;
        resetUpdateTimer(() => setWeightedHints(weightedHintsRef.current));
    }, []);

    useEffect(() => {
        const next = new Map<string, number>();

        filteredHints.forEach((hint) => {
            const weight = getHintWeight(hint);
            next.set(hint, weight);
        });

        onSetWeightedHints(next);

    }, [filteredHints, getHintWeight]);

    const resyncAllHintsWeights = useCallback(() => {
        const next = new Map<string, number>();

        prevHints.current.forEach((hint) => {
            const current = weightedHintsRef.current.get(hint);

            if (current === undefined) {
                return;
            }

            const newWeight = getHintWeight(hint);
            next.set(hint, newWeight);
        });

        onSetWeightedHints(next);
    }, []);

    const resyncHintsWeights = useCallback((hints: string[]) => {

        if (hints.length === 0) {
            return;
        } else if (hints.length >= 50) {
            resyncAllHintsWeights();
            return;
        }

        let updated = false;

        hints.forEach((hint, index) => {
            const current = weightedHintsRef.current.get(hint);

            if (current === undefined) {
                return;
            }

            const newWeight = getHintWeight(hint);
            if (current === getHintWeight(hint)) {
                return;
            }

            updated = true;
            weightedHintsRef.current.set(hint, newWeight);
        });

        if (updated) {
            resetUpdateTimer(() => setWeightedHints(weightedHintsRef.current), 200);
        }

    }, []);

    useSubToHintChange(resyncHintsWeights, owner ?? '');

    const throttledHints = useThrottledMemo(() => {
        return Array.from(weightedHints.entries()).sort((a, b) => {
            if (a[1] === b[1]) {
                return 0;
            }

            return a[1] > b[1] ? -1 : 1;
        }).filter(([, wieght]) => wieght >= 0).map(([hint]) => hint);
    }, [weightedHints]);

    return { hints: throttledHints };
}