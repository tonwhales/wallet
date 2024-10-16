import { calculateSwapAmount } from "./calculateSwapAmount";

describe('calculateSwapAmount', () => {
    it('should calculate swap amount', () => {
        const balance = 100n;
        const rate = 0.5;
        const decimals = 2;
        const result = calculateSwapAmount(balance, rate, decimals);
        expect(result).toBe(50n);
    });
    it('should return undefined if rate is 0', () => {
        const balance = 100n;
        const rate = 0;
        const decimals = 2;
        const result = calculateSwapAmount(balance, rate, decimals);
        expect(result).toBe(undefined);
    });
    it('should return undefined if rate is NaN', () => {
        const balance = 100n;
        const rate = NaN;
        const decimals = 2;
        const result = calculateSwapAmount(balance, rate, decimals);
        expect(result).toBe(undefined);
    });
    it('should return undefined if rate is Infinity', () => {
        const balance = 100n;
        const rate = Infinity;
        const decimals = 2;
        const result = calculateSwapAmount(balance, rate, decimals);
        expect(result).toBe(undefined);
    });
    it('should return undefined if rate is -Infinity', () => {
        const balance = 100n;
        const rate = -Infinity;
        const decimals = 2;
        const result = calculateSwapAmount(balance, rate, decimals);
        expect(result).toBe(undefined);
    });
    it('should return undefined if rate is undefined', () => {
        const balance = 100n;
        const rate = undefined;
        const decimals = 2;
        const result = calculateSwapAmount(balance, rate!, decimals);
        expect(result).toBe(undefined);
    });
});