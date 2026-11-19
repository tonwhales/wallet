import { resolveEndpoint } from './endpoints';

const DEFAULT = 'https://connect.tonhubapi.com';

describe('resolveEndpoint', () => {
    it('ignores the override unless it is allowed', () => {
        expect(resolveEndpoint(DEFAULT, 'http://192.168.1.5:3000', false)).toBe(DEFAULT);
    });

    it('uses a valid override when allowed and trims trailing slashes', () => {
        expect(resolveEndpoint(DEFAULT, 'http://192.168.1.5:3000/', true)).toBe('http://192.168.1.5:3000');
    });

    it('falls back to the default for missing or malformed overrides', () => {
        expect(resolveEndpoint(DEFAULT, undefined, true)).toBe(DEFAULT);
        expect(resolveEndpoint(DEFAULT, '', true)).toBe(DEFAULT);
        expect(resolveEndpoint(DEFAULT, 'not a url', true)).toBe(DEFAULT);
        expect(resolveEndpoint(DEFAULT, 'ftp://host', true)).toBe(DEFAULT);
    });
});
