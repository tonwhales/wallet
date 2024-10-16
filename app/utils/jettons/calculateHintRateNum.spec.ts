import { toNano } from "@ton/core";
import { calculateHintRateNum } from "./calculateHintRateNum";

describe('calculateHintRateNum', () => {
    it('should calculate hint rate number', () => {
        const balance = toNano(100);
        const rate = 0.5;
        const decimals = 9;
        const result = calculateHintRateNum(balance, rate, decimals);
        expect(result).toBe(50);
    });
    it('should return undefined if rate is 0', () => {
        const balance = toNano(100);
        const rate = 0;
        const decimals = 9;
        const result = calculateHintRateNum(balance, rate, decimals);
        expect(result).toBe(undefined);
    });
    it('should return undefined if rate is NaN', () => {
        const balance = 100n;
        const rate = NaN;
        const decimals = 2;
        const result = calculateHintRateNum(balance, rate, decimals);
        expect(result).toBe(undefined);
    });
    it('should return undefined if rate is Infinity', () => {
        const balance = 100n;
        const rate = Infinity;
        const decimals = 2;
        const result = calculateHintRateNum(balance, rate, decimals);
        expect(result).toBe(undefined);
    });
    it('should return undefined if rate is -Infinity', () => {
        const balance = 100n;
        const rate = -Infinity;
        const decimals = 2;
        const result = calculateHintRateNum(balance, rate, decimals);
        expect(result).toBe(undefined);
    });
    it('should return undefined if rate is undefined', () => {
        const balance = 100n;
        const rate = undefined;
        const decimals = 2;
        const result = calculateHintRateNum(balance, rate!, decimals);
        expect(result).toBe(undefined);
    });
});