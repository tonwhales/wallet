import { Address } from '@ton/core';
import { parseAnyStringAddress } from './parseAnyStringAddress';

const addr = 'EQAdpPro8A3NlKjI-QeqWoArlst1IzBhQh95fnIFiB1Jlwg7';
const address = Address.parse(addr);

describe('parseAnyStringAddress', () => {
    it('should parse raw address', () => {
        const parsed = parseAnyStringAddress(address.toRawString(), true);
        expect(parsed.isBounceable).toBe(true);
        expect(parsed.isTestOnly).toBe(true);
        expect(parsed.address.equals(address)).toBe(true);
    });
    it('should parse friendly address', () => {
        const parsed = parseAnyStringAddress(addr, true);
        expect(parsed.isBounceable).toBe(true);
        expect(parsed.isTestOnly).toBe(false);
        expect(parsed.address.equals(address)).toBe(true);
    });
    it('should parse address', () => {
        const parsed = parseAnyStringAddress(address.toString(), true);
        expect(parsed.isBounceable).toBe(true);
        expect(parsed.isTestOnly).toBe(false);
        expect(parsed.address.equals(address)).toBe(true);
    });
    it('should throw error if invalid address', () => {
        expect(() => parseAnyStringAddress('invalid address', true)).toThrowError('Unknown address type: invalid address');
    });
});