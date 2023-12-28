import BN from "bn.js";
import { fromNano, toNano } from "@ton/core";
import { fromBnWithDecimals, toBnWithDecimals } from "./withDecimals";

describe('toBnWithDecimals', () => {
    it('should convert to BN with given decimals', () => {
        const bn0 = toNano('0.000000007');
        const bn1 = toNano('0.000000099');
        const bn2 = toNano('0.000000999');
        const bn3 = toNano('0.000009999');
        const bn8 = toNano('0.999999999');
        const bn9 = toNano('0.999999999');
        const bn10 = toNano('99.999999999');
        const bn18 = toNano('9999999999.999999998');

        let res0 = toBnWithDecimals('7', 0)!;
        expect(res0).not.toBeNull();
        expect(res0).not.toBeUndefined();
        expect(res0 === bn0).toBe(true);

        let res1 = toBnWithDecimals('9.9', 1)!;
        expect(res1).not.toBeNull();
        expect(res1).not.toBeUndefined();
        expect(res1 === bn1).toBe(true);

        let res2 = toBnWithDecimals('9.99', 2)!;
        expect(res2).not.toBeNull();
        expect(res2).not.toBeUndefined();
        expect(res2 === bn2).toBe(true);

        let res3 = toBnWithDecimals('9.999', 3)!;
        expect(res3).not.toBeNull();
        expect(res3).not.toBeUndefined();
        expect(res3 === bn3).toBe(true);

        let res8 = toBnWithDecimals('9.99999999', 8)!;
        expect(res8).not.toBeNull();
        expect(res8).not.toBeUndefined();
        expect(res8 === bn8).toBe(true);

        let res9 = toBnWithDecimals('0.999999999', 9)!;
        expect(res9).not.toBeNull();
        expect(res9).not.toBeUndefined();
        expect(res9 === bn9).toBe(true);

        let res10 = toBnWithDecimals('9.9999999999', 10)!;
        expect(res10).not.toBeNull();
        expect(res10).not.toBeUndefined();
        expect(res10 === bn10).toBe(true);

        let res18 = toBnWithDecimals('9.999999999999999998', 18)!;
        expect(res18).not.toBeNull();
        expect(res18).not.toBeUndefined();
        expect(res18 === bn18).toBe(true);

        let res = toBnWithDecimals('0.1', 1)!;
        expect(res).not.toBeNull();
        expect(res).not.toBeUndefined();
        expect(Number(res) === 1).toBe(true);

        try {
            toBnWithDecimals('0.01', 1)
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.message).toBe("Invalid number");
        }

        try {
            toBnWithDecimals('0.00000000001', 10)
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.message).toBe("Invalid number");
        }
    });
});

describe('fromBNWithDecimals', () => {
    it('should convert to a float string from BN with given decimals', () => {
        const bn0 = toNano('0.000000007');
        const bn1 = toNano('0.000000099');
        const bn2 = toNano('0.000000999');
        const bn3 = toNano('0.000009999');
        const bn8 = toNano('0.999999999');
        const bn9 = toNano('0.999999999');
        const bn10 = toNano('99.999999999');
        const bn18 = toNano('9999999999.999999998');

        let res0 = fromBnWithDecimals(bn0, 0)!;
        expect(res0).not.toBeNull();
        expect(res0).not.toBeUndefined();
        expect(res0 === '7').toBe(true);

        let res1 = fromBnWithDecimals(bn1, 1)!;
        expect(res1).not.toBeNull();
        expect(res1).not.toBeUndefined();
        expect(res1 === '9.9').toBe(true);

        let res2 = fromBnWithDecimals(bn2, 2)!;
        expect(res2).not.toBeNull();
        expect(res2).not.toBeUndefined();
        expect(res2 === '9.99').toBe(true);

        let res3 = fromBnWithDecimals(bn3, 3)!;
        expect(res3).not.toBeNull();
        expect(res3).not.toBeUndefined();
        expect(res3 === '9.999').toBe(true);

        let res8 = fromBnWithDecimals(bn8, 8)!;
        expect(res8).not.toBeNull();
        expect(res8).not.toBeUndefined();
        expect(res8 === '9.99999999').toBe(true);

        let res9 = fromBnWithDecimals(bn9, 9)!;
        expect(res9).not.toBeNull();
        expect(res9).not.toBeUndefined();
        expect(res9 === '0.999999999').toBe(true);

        let res10 = fromBnWithDecimals(bn10, 10)!;
        expect(res10).not.toBeNull();
        expect(res10).not.toBeUndefined();
        expect(res10 === '9.9999999999').toBe(true);

        let res18 = fromBnWithDecimals(bn18, 18)!;
        expect(res18).not.toBeNull();
        expect(res18).not.toBeUndefined();
        expect(res18 === '9.999999999999999998').toBe(true);

        try {
            fromBnWithDecimals('jshdkfshjddk', 0)
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.message).toBe("Cannot convert jshdkfshjddk to a BigInt");
        }
    });
});