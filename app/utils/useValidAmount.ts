import { toNano } from "@ton/core";
import { useMemo } from "react";

export function useValidAmount(amount: string) {
    return useMemo(() => {
        if (amount.length === 0) {
            return 0n;
        }
        let value: bigint | null = null;
        try {
            const valid = amount.replace(',', '.').replaceAll(' ', '');
            value = toNano(valid);
            return value;
        } catch {
            return null;
        }
    }, [amount]);
}