import { useCallback, useEffect } from "react";
import { useSortedHintsState } from "./useSortedHints";
import { useNetwork } from "..";
import { compareHints, filterHint, getHint } from "../../../utils/hintSortFilter";
import { queryClient } from "../../clients";
import { QueryCacheNotifyEvent } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { getQueryData } from "../../utils/getQueryData";
import { throttle } from "../../../utils/throttle";

function useSubToHintChange(
    onChangeMany: () => void,
    owner: string,
) {
    useEffect(() => {
        const cache = queryClient.getQueryCache();
        const unsub = cache.subscribe((e: QueryCacheNotifyEvent) => {
            if (e.type === 'updated') {
                const queryKey = e.query.queryKey;

                if (
                    (queryKey[0] === 'hints' && queryKey[1] === owner)
                    || (queryKey[0] === 'contractMetadata')
                    || (queryKey[0] === 'account' && queryKey[2] === 'jettonWallet')
                    || (queryKey[0] === 'jettons' && queryKey[1] === 'swap')
                    || (queryKey[0] === 'jettons' && queryKey[1] === 'master' && queryKey[3] === 'content')
                ) {
                    onChangeMany();
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
    }, 2 * 1000), [setSortedHints]);

    useSubToHintChange(resyncAllHintsWeights, address ?? '');
}