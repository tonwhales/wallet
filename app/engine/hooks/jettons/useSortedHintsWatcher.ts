import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSortedHintsMap } from "./useSortedHints";
import { useClient4, useHints, useNetwork } from "..";
import { computeHintWeight } from "../../../utils/computeHintWeight";
import { queryClient } from "../../clients";
import { QueryCacheNotifyEvent } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { jettonWalletAddressQueryFn } from "./useJettonWalletAddress";
import { throttle } from "../../../utils/throttle";

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

function equalByContent(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    return a.every((hint) => b.includes(hint));
}

function useSubToHintChange(
    onChangeMany: (hints: string[]) => void,
    owner: string,
) {
    const isTestnet = useNetwork().isTestnet;
    const client = useClient4(isTestnet);
    const hints = useHints(owner);
    const hintsRef = useRef<string[]>(hints);

    useEffect(() => {
        if (!equalByContent(hints, hintsRef.current)) {
            hintsRef.current = hints;
        }
    }, [hints]);

    const toUdateRef = useRef<Set<string>>(new Set<string>());

    const updateHint = useCallback((hint: string) => {
        toUdateRef.current.add(hint);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const hints = Array.from(toUdateRef.current);
            toUdateRef.current.clear();
            onChangeMany(hints);
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [onChangeMany, owner, isTestnet]);

    useEffect(() => {
        const unsub = queryClient.getQueryCache().subscribe((e: QueryCacheNotifyEvent) => {
            if (e.type === 'updated' || e.type === 'observerResultsUpdated') {
                const queryKey = e.query.queryKey;

                if (queryKey[0] === 'hints' && queryKey[1] === owner) {
                    const hints = queryClient.getQueryData<string[]>(Queries.Hints(owner));
                    if (!!hints && !equalByContent(hints, hintsRef.current)) {
                        onChangeMany(hints);
                    }
                }

                if (queryKey[0] === 'contractMetadata') {
                    const hint = queryKey[1];
                    if (!!hint) {
                        updateHint(hint);
                    }
                }

                if (queryKey[0] === 'account' && queryKey[2] === 'jettonWallet') {
                    const hint = queryKey[1];
                    if (!!hint) {
                        updateHint(hint);
                    }
                }

                if (queryKey[0] === 'jettons' && queryKey[1] === 'master' && queryKey[3] === 'content') {
                    const master = queryKey[2];

                    // fetch jetton wallet address
                    (async () => {
                        const jettonWalletAddressCache = queryClient.getQueryData<string | null>(Queries.Jettons().Address(master).Wallet(owner));

                        if (jettonWalletAddressCache) {
                            updateHint(jettonWalletAddressCache);
                        } else {
                            try {
                                const res = await queryClient.fetchQuery({
                                    queryKey: Queries.Jettons().Address(master).Wallet(owner),
                                    queryFn: jettonWalletAddressQueryFn(client, master, owner, isTestnet)
                                });

                                if (!!res) {
                                    updateHint(res);
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
    }, [updateHint, owner, isTestnet]);
}

export function useSortedHintsWatcher(address?: string) {
    const owner = useMemo(() => {
        return address;
    }, [address]);
    const { isTestnet } = useNetwork();

    const [sortedHints, setSortedHints] = useSortedHintsMap(owner);
    const sortedHintsRef = useRef(sortedHints);

    // throttled setter
    const udateSortedHintsThrottled = throttle((newWeighted: Map<string, number>) => {
        setSortedHints(Object.fromEntries(newWeighted));
    }, 500);

    const resyncHintsWeight = useCallback((hints: string[]) => {
        if (hints.length === 0) {
            return;
        }

        const newHints = new Map(Object.entries(sortedHintsRef.current));

        // update only if previous weight is negative or not found
        hints.forEach((hint) => {
            const currentWeight = newHints.get(hint) ?? -100;
            if (currentWeight < 0) {
                const weight = computeHintWeight(hint, isTestnet, getHintWeights());
                newHints.set(hint, weight);
            }
        });

        sortedHintsRef.current = Object.fromEntries(newHints);

        udateSortedHintsThrottled(newHints);
    }, [udateSortedHintsThrottled]);

    useSubToHintChange(resyncHintsWeight, owner ?? '');
}