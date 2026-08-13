import { AppVersionsConfig } from '../engine/api/fetchAppVersionsConfig';
import { forceUpdateState, forceUpdateUrl } from './newVersionUrl';

jest.mock('expo-application', () => ({ get nativeApplicationVersion() { return mockedVersion; } }));
jest.mock('react-native', () => ({ get Platform() { return { OS: mockedPlatform }; } }));

let mockedVersion: string | null = '2.5.45';
let mockedPlatform: 'ios' | 'android' = 'ios';

const config = (minimal?: string, androidMinimal?: string): AppVersionsConfig => ({
    ios: { minimal, critical: '2.5.44', latest: '2.5.46', url: 'store://ios' },
    android: { minimal: androidMinimal ?? minimal, critical: '2.5.44', latest: '2.5.46', url: 'store://android' },
    createdAt: 0,
    updatedAt: 0
});

describe('forceUpdateUrl', () => {
    beforeEach(() => { mockedVersion = '2.5.45'; mockedPlatform = 'ios'; });

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

    it('reads the running platform section, not always ios', () => {
        mockedPlatform = 'android';
        // ios blocked, android not — an android device must follow the android section
        expect(forceUpdateUrl(config('2.5.46', '2.5.40'))).toBeNull();
        expect(forceUpdateUrl(config('2.5.40', '2.5.46'))).toBe('store://android');
    });

    // Internal builds carry versions like 2.5.45-rc1; parseInt keeps the numeric part,
    // so they compare as their release version instead of throwing. Pinned deliberately:
    // a testers-only build must not escape a block that applies to the release
    it('treats a suffixed version as its numeric release version', () => {
        mockedVersion = '2.5.45-rc1';
        expect(forceUpdateUrl(config('2.5.46'))).toBe('store://ios');
        expect(forceUpdateUrl(config('2.5.45'))).toBeNull();
    });
});

describe('forceUpdateState', () => {
    const base = { config: config('2.5.46'), isSuccess: true, dataUpdatedAt: 2000, mountedAt: 1000, ready: true };
    beforeEach(() => { mockedVersion = '2.5.45'; mockedPlatform = 'ios'; });

    it('blocks when a fresh response says so', () => {
        expect(forceUpdateState(base)).toBe('store://ios');
    });

    // The config react-query hydrates from disk predates the mount; blocking on it would
    // keep users locked out after `minimal` was already lifted on the server
    it('never blocks on the persisted config alone', () => {
        expect(forceUpdateState({ ...base, dataUpdatedAt: 500 })).toBeNull();
        expect(forceUpdateState({ ...base, dataUpdatedAt: 1000 })).toBeNull();
    });

    // query-core also flags a failed fetch as "fetched after mount", leaving stale data
    it('never blocks while the request is failing or still in flight', () => {
        expect(forceUpdateState({ ...base, isSuccess: false })).toBeNull();
    });

    it('never blocks before the app finished starting up', () => {
        expect(forceUpdateState({ ...base, ready: false })).toBeNull();
    });

    it('does not block a fresh response without a minimal', () => {
        expect(forceUpdateState({ ...base, config: config(undefined) })).toBeNull();
    });
});
