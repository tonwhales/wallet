import { compareVersions } from "./compareVersions";

describe('compareVersions', () => {
    it('should return 1 if a is greater than b', () => {
        const a = '2.11.0';
        const b = '2.10.0';

        const result = compareVersions(a, b);
        expect(result).toBe(1);
    });

    it('should return -1 if a is less than b', () => {
        const a = '2.10.0';
        const b = '2.11.0';

        const result = compareVersions(a, b);
        expect(result).toBe(-1);
    });

    it('should return 0 if a is equal to b', () => {
        const a = '2.10.0';
        const b = '2.10.0';

        const result = compareVersions(a, b);
        expect(result).toBe(0);
    });

    it('should throw an error if a is not a number', () => {
        const a = '2.10.abcd';
        const b = '2.10.0';

        expect(() => compareVersions(a, b)).toThrow();
    });

    it('should throw an error if b is not a number', () => {
        const a = '2.10.0';
        const b = '2.10.abcd';

        expect(() => compareVersions(a, b)).toThrow();
    });
});