import { warn } from "../log";
import { fromBnWithDecimals } from "../withDecimals";
import { calculateSwapAmount } from "./calculateSwapAmount";

export function calculateHintRateNum(balance: bigint, rate: number, decimals: number) {
    try {
        const swapAmount = rate ? calculateSwapAmount(balance, rate, decimals) : undefined;
        const rateString = swapAmount ? fromBnWithDecimals(swapAmount, decimals) : undefined;
        if (!rateString) {
            return undefined;
        }
        return Number(rateString);
    } catch {
        warn('Failed to calculate hint rate number');
        return undefined;
    }
}