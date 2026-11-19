import { FLAGS_MAX_AGE_MS } from './flagRegistry';
import { msUntilFlagsExpire, resolveFlagValue } from './resolveFlagValue';

const NOW = 1_700_000_000_000;

describe('resolveFlagValue', () => {
    it('returns the registry default when nothing has been loaded', () => {
        expect(resolveFlagValue('ownExchangeSwap', null, NOW)).toBe(false);
        expect(resolveFlagValue('ownExchangeSwap', undefined, NOW)).toBe(false);
    });

    it('returns the server value for a fresh snapshot', () => {
        const snapshot = { flags: { ownExchangeSwap: true }, updatedAt: NOW - 1000 };
        expect(resolveFlagValue('ownExchangeSwap', snapshot, NOW)).toBe(true);
    });

    it('falls back to the default for a flag the server did not send', () => {
        const snapshot = { flags: {}, updatedAt: NOW };
        expect(resolveFlagValue('ownExchangeSwap', snapshot, NOW)).toBe(false);
    });

    it('ignores values of the wrong type', () => {
        const snapshot = { flags: { ownExchangeSwap: 'true' }, updatedAt: NOW };
        expect(resolveFlagValue('ownExchangeSwap', snapshot, NOW)).toBe(false);
    });

    it('does not trust a snapshot older than the maximum age, so a kill switch cannot be missed forever', () => {
        const stale = { flags: { ownExchangeSwap: true }, updatedAt: NOW - FLAGS_MAX_AGE_MS - 1 };
        const edge = { flags: { ownExchangeSwap: true }, updatedAt: NOW - FLAGS_MAX_AGE_MS };
        expect(resolveFlagValue('ownExchangeSwap', stale, NOW)).toBe(false);
        expect(resolveFlagValue('ownExchangeSwap', edge, NOW)).toBe(true);
    });
});

describe('msUntilFlagsExpire', () => {
    it('is positive while the snapshot is still trusted and not positive once resolveFlagValue stops trusting it', () => {
        const updatedAt = NOW - 1000;
        expect(msUntilFlagsExpire(updatedAt, NOW)).toBe(FLAGS_MAX_AGE_MS - 1000 + 1);

        const expiredAt = updatedAt + FLAGS_MAX_AGE_MS + 1;
        expect(msUntilFlagsExpire(updatedAt, expiredAt)).toBeLessThanOrEqual(0);
        expect(resolveFlagValue('ownExchangeSwap', { flags: { ownExchangeSwap: true }, updatedAt }, expiredAt)).toBe(false);
    });
});
