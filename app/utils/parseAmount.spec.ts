import { parseAmountToBn, parseAmountToNumber } from './parseAmount';


describe('parseAmountToBn', () => {
    it.each([
        ['64 438.991762792'],
        ['438.991762792'],
        ['0.000000001'],
        ['0'],
        ['222 222 222.1']
    ])('should not fail', (amount) => {
        parseAmountToBn(amount);
    });
});

describe('parseAmountToNumber', () => {
    it.each([
        ['64 438.991762792', 64438.991762792],
        ['438.991762792', 438.991762792],
        ['0.000000001', 0.000000001],
        ['0', 0],
        ['222 222 222.1', 222_222_222.1]
    ])('should not fail', (amount, expected) => {
        expect(parseAmountToNumber(amount)).toBe(expected);
    });
});