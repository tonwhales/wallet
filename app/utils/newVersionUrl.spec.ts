import { AppVersionsConfig } from '../engine/api/fetchAppVersionsConfig';
import { forceUpdateUrl } from './newVersionUrl';

jest.mock('expo-application', () => ({ get nativeApplicationVersion() { return mockedVersion; } }));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

let mockedVersion: string | null = '2.5.45';

const config = (minimal?: string): AppVersionsConfig => ({
    ios: { minimal, critical: '2.5.44', latest: '2.5.46', url: 'store://ios' },
    android: { minimal, critical: '2.5.44', latest: '2.5.46', url: 'store://android' },
    createdAt: 0,
    updatedAt: 0
});

describe('forceUpdateUrl', () => {
    beforeEach(() => { mockedVersion = '2.5.45'; });

    it('blocks builds below the minimal version', () => {
        expect(forceUpdateUrl(config('2.5.46'))).toBe('store://ios');
    });

    it('does not block the minimal version itself', () => {
        expect(forceUpdateUrl(config('2.5.45'))).toBeNull();
    });

    it('does not block builds above the minimal version', () => {
        expect(forceUpdateUrl(config('2.5.40'))).toBeNull();
    });

    it('does not block when no minimal version is configured', () => {
        expect(forceUpdateUrl(config(undefined))).toBeNull();
        expect(forceUpdateUrl(null)).toBeNull();
        expect(forceUpdateUrl(undefined)).toBeNull();
    });

    it('does not block on unparsable versions', () => {
        expect(forceUpdateUrl(config('not-a-version'))).toBeNull();
        mockedVersion = null;
        expect(forceUpdateUrl(config('2.5.46'))).toBeNull();
    });
});
