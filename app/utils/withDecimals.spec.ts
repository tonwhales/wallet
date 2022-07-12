import { fromBNWithDecimals, toBNWithDecimals, toNanoWithDecimals } from "./withDecimals";

describe('toNanoWithDecimals', () => {
    it('should convert BN to a nano BN with given decimals', () => {
        let res = toNanoWithDecimals('0f3a70', 3)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.toNumber() === 998000000000).toBe(true);

        res = toNanoWithDecimals('26a0', 1)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.toNumber() === 988800000000).toBe(true);

        res = toNanoWithDecimals('174876e800', 8)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.toNumber() === 1000000000000).toBe(true);
    });
});

describe('toBNWithDecimals', () => {
    it('should convert to BN given decimals', () => {
        let res = toBNWithDecimals('0.1', 1)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res.toNumber() === 1).toBe(true);

        try {
            toBNWithDecimals('0.01', 1)
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.message).toBe("while converting number 0.01 to wei, too many decimal places");
        }

        try {
            toBNWithDecimals('0.00000000001', 10)
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.message).toBe("while converting number 0.00000000001 to wei, too many decimal places");
        }
    });
});

describe('fromBNWithDecimals', () => {
    it('should convert to a float string from BN with given decimals', () => {
        let res = fromBNWithDecimals('0f3a70', 3)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res === '998.000').toBe(true);

        res = fromBNWithDecimals('26a0', 1)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(res).toBe('988.8');

        try {
            fromBNWithDecimals('jshdkfshjddk', 0)
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.message).toBe("[number-to-bn] while converting number \"jshdkfshjddk\" to BN.js instance, error: invalid number value. Value must be an integer, hex string, BN or BigNumber instance. Note, decimals are not supported.");
        }
    });
});