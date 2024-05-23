import { Address, fromNano, toNano } from "@ton/core";
import { useMemo } from "react";
import { useLiquidStaking } from "./useLiquidStaking";
import { useLiquidStakingMember } from "./useLiquidStakingMember";

export function useLiquidStakingBalance(address?: Address) {
    const liquidStaking = useLiquidStaking().data;
    const liquidNominator = useLiquidStakingMember(address)?.data;

    return useMemo(() => {
        try {
            const bal = fromNano(liquidNominator?.balance || 0n);
            const rate = fromNano(liquidStaking?.rateWithdraw || 0n);
            return toNano((parseFloat(bal) * parseFloat(rate)).toFixed(9));
        } catch (error) {
            return 0n;
        }
    }, [liquidNominator?.balance, liquidStaking?.rateWithdraw]);
}