import { memo } from "react";
import { usePendingWatcher } from "../engine/hooks";

export const PendingTxsWatcher = memo(() => {
    // clear pending txs on account change
    usePendingWatcher();
    return <></>;
});