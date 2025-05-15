import { useNetwork } from "../network";
import { useEthena, useHintsFull } from "..";
import { Address } from "@ton/core";
import { useMemo } from "react";

export function useUSDeAssetsShares(address?: Address) {
    const { isTestnet } = useNetwork();
    const hintsFull = useHintsFull(address?.toString({ testOnly: isTestnet })).data;
    const { minter, tsMinter } = useEthena();

    const usdeShares = useMemo(() => {
        const usdeHintIndex = hintsFull?.addressesIndex[minter.toString({ testOnly: isTestnet })];
        const tsUsdeHintIndex = hintsFull?.addressesIndex[tsMinter.toString({ testOnly: isTestnet })];

        const usdeHint = usdeHintIndex !== undefined ? hintsFull?.hints[usdeHintIndex] : null;
        const tsUsdeHint = tsUsdeHintIndex !== undefined ? hintsFull?.hints[tsUsdeHintIndex] : null;

        if (!usdeHint && !tsUsdeHint) {
            return null;
        }

        return {
            usdeHint,
            tsUsdeHint
        }

    }, [hintsFull, minter, tsMinter, isTestnet]);

    return usdeShares;
}