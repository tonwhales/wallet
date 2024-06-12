import { useCallback, useEffect } from "react";
import { getSortedHints, useSortedHintsState } from "./useSortedHints";
import { useNetwork } from "..";
import { compareHints, filterHint, getHint } from "../../../utils/hintSortFilter";
import { queryClient } from "../../clients";
import { QueryCacheNotifyEvent } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { getQueryData } from "../../utils/getQueryData";
import { throttle } from "../../../utils/throttle";

// check if two arrays are equal by content invariant of the order
function areArraysEqualByContent<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    const aCopy = [...a].sort();
    const bCopy = [...b].sort();

    for (let i = 0; i < aCopy.length; i++) {
        if (aCopy[i] !== bCopy[i]) {
            return false;
        }
    }

    return true;
}

function useSubToHintChange(
    onChangeMany: (source?: string) => void,
    owner: string,
) {
    useEffect(() => {
        const cache = queryClient.getQueryCache();
        const unsub = cache.subscribe((e: QueryCacheNotifyEvent) => {
            if (e.type === 'updated') {
                const queryKey = e.query.queryKey;

                if (queryKey[0] === 'hints' && queryKey[1] === owner) {
                    // check if the hint was added or removed
                    const sorted = getSortedHints(owner);
                    const hints = getQueryData<string[]>(cache, Queries.Hints(owner));

                    // do not trigger if the hints are the same set
                    if (areArraysEqualByContent(sorted, hints ?? [])) {
                        return;
                    }

                    onChangeMany(`${e.type} ${queryKey.join(',')}`);
                } else if (
                    (queryKey[0] === 'hints' && queryKey[1] === owner)
                    || (queryKey[0] === 'contractMetadata')
                    || (queryKey[0] === 'account' && queryKey[2] === 'jettonWallet')
                    || (queryKey[0] === 'jettons' && queryKey[1] === 'swap')
                    || (queryKey[0] === 'jettons' && queryKey[1] === 'master' && queryKey[3] === 'content')
                ) {
                    onChangeMany(`${e.type} ${queryKey.join(',')}`);
                }
            }
        });

        return unsub;
    }, [owner, onChangeMany]);
}

export function useSortedHintsWatcher(address?: string) {
    const { isTestnet } = useNetwork();
    const [, setSortedHints] = useSortedHintsState(address);

    const resyncAllHintsWeights = useCallback(throttle(() => {
        const hints = getQueryData<string[]>(queryClient.getQueryCache(), Queries.Hints(address ?? ''));
        if (!hints) {
            return;
        }

        const sorted = hints
            .map((h) => getHint(h, isTestnet))
            .sort(compareHints).filter(filterHint([])).map((x) => x.address);

        setSortedHints(sorted);
    }, 3 * 1000), [setSortedHints]);

    useSubToHintChange(resyncAllHintsWeights, address ?? '');
}