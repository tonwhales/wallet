import { memo } from "react";
import { usePendingWatcher } from "../engine/hooks";

export const PendingTxsWatcher = memo((props: { address?: string }) => {
    // clear pending txs on account change
    usePendingWatcher(props.address);
    return null;
});