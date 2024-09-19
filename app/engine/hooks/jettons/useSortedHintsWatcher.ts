import { useCallback, useEffect } from "react";
import { getSortedHints, useSortedHintsState } from "./useSortedHints";
import { useNetwork } from "..";
import { compareHints, filterHint, getHint, getMintlessHint } from "../../../utils/hintSortFilter";
import { queryClient } from "../../clients";
import { QueryCacheNotifyEvent } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { getQueryData } from "../../utils/getQueryData";
import { throttle } from "../../../utils/throttle";
import { MintlessJetton } from "../../api/fetchMintlessHints";

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

enum HintType {
    Hint = 'hint',
    Mintless = 'mintless'
}

type SortableHint = { hintType: HintType.Hint, address: string }
    | { hintType: HintType.Mintless, address: string, hint: MintlessJetton };

export function useSortedHintsWatcher(address?: string) {
    const { isTestnet } = useNetwork();
    const [, setSortedHints] = useSortedHintsState(address);

    const resyncAllHintsWeights = useCallback(throttle(() => {
        const cache = queryClient.getQueryCache();
        const hints = getQueryData<string[]>(cache, Queries.Hints(address ?? ''));
        const mintlessHints = getQueryData<MintlessJetton[]>(cache, Queries.Mintless(address ?? ''));

        const allHints = [
            ...(hints || []).map((h) => ({ hintType: HintType.Hint, address: h })),
            ...(mintlessHints || []).map((h) => ({ hintType: HintType.Mintless, address: h.walletAddress.address, hint: h }))
        ]

        const allHintsSet = new Set([...hints ?? [], ...mintlessHints?.map((h) => h.walletAddress.address) ?? []]);

        const noDups: SortableHint[] = Array.from(allHintsSet).map((a) => {
            const hint = allHints.find((h) => h.address === a);

            if (!hint) {
                return null;
            }

            return hint;
        }).filter((x) => !!x) as SortableHint[];

        const sorted = noDups
            .map((h) => {
                if (h.hintType === HintType.Hint) {
                    return getHint(cache, h.address, isTestnet);
                }

                return getMintlessHint(cache, h.hint, isTestnet);
            })
            .sort(compareHints).filter(filterHint([])).map((x) => x.address);

        setSortedHints(sorted);
    }, 3 * 1000), [setSortedHints]);

    useSubToHintChange(resyncAllHintsWeights, address ?? '');
}