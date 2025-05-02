import { useNetwork } from "../network";
import { useHintsFull } from "..";
import { gettsUSDeMinter, getUSDeMinter } from "../../../secure/KnownWallets";
import { Address } from "@ton/core";
import { useMemo } from "react";

export function useUSDeAssetsShares(address?: Address) {
    const { isTestnet } = useNetwork();
    const hintsFull = useHintsFull(address?.toString({ testOnly: isTestnet })).data;
    const usdeMinter = getUSDeMinter(isTestnet);
    const tsUsdeMinter = gettsUSDeMinter(isTestnet);

    const usdeShares = useMemo(() => {
        const usdeHintIndex = hintsFull?.addressesIndex[usdeMinter.toString({ testOnly: isTestnet })];
        const tsUsdeHintIndex = hintsFull?.addressesIndex[tsUsdeMinter.toString({ testOnly: isTestnet })];

        const usdeHint = usdeHintIndex !== undefined ? hintsFull?.hints[usdeHintIndex] : null;
        const tsUsdeHint = tsUsdeHintIndex !== undefined ? hintsFull?.hints[tsUsdeHintIndex] : null;

        if (!usdeHint && !tsUsdeHint) {
            return null;
        }

        return {
            usdeHint,
            tsUsdeHint
        }

    }, [hintsFull, usdeMinter, tsUsdeMinter, isTestnet]);

    return usdeShares;
}