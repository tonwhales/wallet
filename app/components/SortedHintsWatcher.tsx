import { memo } from "react";
import { useSortedHintsWatcher } from "../engine/hooks/jettons/useSortedHintsWatcher";

export const SortedHintsWatcher = memo(({ owner }: { owner?: string}) => {
    useSortedHintsWatcher(owner);
    return null;
});