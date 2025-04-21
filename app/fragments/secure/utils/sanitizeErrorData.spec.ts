import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { sanitizeErrorData } from "./sanitizeErrorData";

describe('sanitizeErrorData', () => {
    it('should return the same string if it does not contain any sensitive data', () => {
        const input = 'Program consumed: 4374 of 200000 compute units';
        const result = sanitizeErrorData(input);
        expect(result).toBe(input);
    });

    it('should clear hex strings with separators', () => {
        const input = '0x1234567890abcdef1234567890abcdef';
        const result = sanitizeErrorData(input);
        expect(result).toBe('[hex_string_data]');
    });

    it('should clear base58 strings', () => {
        const input = bs58.encode(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]));
        const result = sanitizeErrorData(input);
        expect(result).toBe('[base58_string_data]');
    });

    it('should clear Uint8Array objects', () => {
        const uintArrWith20RandomBytes = new Uint8Array(20);
        for (let i = 0; i < uintArrWith20RandomBytes.length; i++) {
            uintArrWith20RandomBytes[i] = Math.floor(Math.random() * 256);
        }
        const input = uintArrWith20RandomBytes.toString();
        const result = sanitizeErrorData(input);
        expect(result).toBe('[uint8array_object]');
    });
});