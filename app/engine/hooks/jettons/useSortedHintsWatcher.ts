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
    reSortHints: () => void,
    owner: string,
) {
    useEffect(() => {
        const cache = queryClient.getQueryCache();
        const unsub = cache.subscribe((e: QueryCacheNotifyEvent) => {
            const queryKey = e.query.queryKey;
            if (e.type === 'updated') {
                const action = e.action;

                // only care about success updates
                if (action.type !== 'success') {
                    return;
                }

                if (queryKey[0] === 'hints' && queryKey[1] === owner) {
                    // check if the hint was added or removed
                    const sorted = getSortedHints(owner);
                    const hints = action.data as string[] | undefined | null;

                    // do not trigger if the hints are the same set
                    if (areArraysEqualByContent(sorted, hints ?? [])) {
                        return;
                    }

                    reSortHints();
                } else if (
                    (queryKey[0] === 'contractMetadata')
                    || (queryKey[0] === 'account' && queryKey[2] === 'jettonWallet')
                    || (queryKey[0] === 'jettons' && queryKey[1] === 'master' && queryKey[3] === 'content')
                ) {
                    reSortHints();
                } else if ((queryKey[0] === 'jettons' && queryKey[1] === 'swap')) {
                    // check if the "price" changed so we can re-sort the hints
                    const newData = action.data as bigint | undefined | null;
                    const prev = getQueryData<bigint | undefined | null>(cache, queryKey);

                    if (newData === prev) {
                        return;
                    }

                    reSortHints();
                }
            }
        });

        return unsub;
    }, [owner, reSortHints]);
}

export function useSortedHintsWatcher(address?: string) {
    const { isTestnet } = useNetwork();
    const [, setSortedHints] = useSortedHintsState(address);

    const resyncAllHintsWeights = useCallback(throttle(() => {
        const cache = queryClient.getQueryCache();
        const hints = getQueryData<string[]>(cache, Queries.Hints(address ?? ''));
        if (!hints) {
            return;
        }

        const sorted = hints
            .map((h) => getHint(cache, h, isTestnet))
            .sort(compareHints).filter(filterHint([])).map((x) => x.address);

        setSortedHints(sorted);
    }, 3 * 1000), [setSortedHints]);

    useSubToHintChange(resyncAllHintsWeights, address ?? '');
}