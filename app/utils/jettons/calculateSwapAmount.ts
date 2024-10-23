import { warn } from "../log";

export function calculateSwapAmount(balance: bigint, rate: number, decimals: number) {
    try {
        const scaleFactor = BigInt(10 ** decimals);
        const scaledRate = rate ? BigInt(Math.round(rate * 10 ** decimals)) : undefined;
        const swapAmount = scaledRate ? (balance * scaledRate) / scaleFactor : undefined;

        return swapAmount;
    } catch {
        warn('Failed to calculate swap amount');
        return undefined;
    }
}