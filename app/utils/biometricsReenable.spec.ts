import { Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricsState, biometricsReenablePendingKey, encryptAndStoreAppKeyWithBiometrics, getBiometricsState } from '../storage/secureStorage';
import { markBiometricsReenablePending, offerBiometricsReenable } from './biometricsReenable';

const mockMemory = new Map<string, unknown>();

jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('expo-local-authentication', () => ({
    getEnrolledLevelAsync: jest.fn(),
    SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC: 2 }
}));
jest.mock('../storage/storage', () => ({
    storage: {
        set: (key: string, value: unknown) => mockMemory.set(key, value),
        getBoolean: (key: string) => mockMemory.get(key) as boolean | undefined,
        delete: (key: string) => mockMemory.delete(key)
    }
}));
jest.mock('../storage/secureStorage', () => ({
    BiometricsState: { NotSet: 'not-set', DontUse: 'dont-use', InUse: 'in-use' },
    biometricsReenablePendingKey: 'biometrics-reenable-pending',
    encryptAndStoreAppKeyWithBiometrics: jest.fn(),
    getBiometricsState: jest.fn()
}));
jest.mock('../i18n/t', () => ({ t: (key: string) => key }));
jest.mock('./log', () => ({ warn: jest.fn() }));

const alertMock = Alert.alert as jest.Mock;
const levelMock = LocalAuthentication.getEnrolledLevelAsync as jest.Mock;
const stateMock = getBiometricsState as jest.Mock;
const encryptMock = encryptAndStoreAppKeyWithBiometrics as jest.Mock;
const setState = jest.fn();

const BIOMETRIC = 2;
const SECRET = 1;

function pressEnable() {
    const buttons = alertMock.mock.calls[0][2] as { text: string, onPress?: () => Promise<void> }[];
    const enable = buttons.find((b) => b.text === 'security.auth.biometricsReenable.enable');
    return enable?.onPress?.();
}

describe('offerBiometricsReenable', () => {
    beforeEach(() => {
        mockMemory.clear();
        jest.clearAllMocks();
        stateMock.mockReturnValue(BiometricsState.NotSet);
        levelMock.mockResolvedValue(BIOMETRIC);
    });

    it('shows nothing when no invalidation was recorded', async () => {
        await offerBiometricsReenable('1234', setState);
        expect(alertMock).not.toHaveBeenCalled();
    });

    it('offers once when invalidation was recorded and biometrics are enrolled', async () => {
        markBiometricsReenablePending();
        await offerBiometricsReenable('1234', setState);
        expect(alertMock).toHaveBeenCalledTimes(1);
        expect(mockMemory.has(biometricsReenablePendingKey)).toBe(false);

        await offerBiometricsReenable('1234', setState);
        expect(alertMock).toHaveBeenCalledTimes(1);
    });

    it('keeps the pending mark and shows nothing when no biometrics are enrolled', async () => {
        levelMock.mockResolvedValue(SECRET);
        markBiometricsReenablePending();
        await offerBiometricsReenable('1234', setState);
        expect(alertMock).not.toHaveBeenCalled();
        expect(mockMemory.get(biometricsReenablePendingKey)).toBe(true);
    });

    it('drops the pending mark without a dialog when biometrics are already in use', async () => {
        stateMock.mockReturnValue(BiometricsState.InUse);
        markBiometricsReenablePending();
        await offerBiometricsReenable('1234', setState);
        expect(alertMock).not.toHaveBeenCalled();
        expect(mockMemory.has(biometricsReenablePendingKey)).toBe(false);
    });

    it('does not throw when the enrolled level cannot be read', async () => {
        levelMock.mockRejectedValue(new Error('boom'));
        markBiometricsReenablePending();
        await expect(offerBiometricsReenable('1234', setState)).resolves.toBeUndefined();
        expect(alertMock).not.toHaveBeenCalled();
    });

    it('turns biometrics on only after the key was stored', async () => {
        markBiometricsReenablePending();
        await offerBiometricsReenable('1234', setState);
        await pressEnable();
        expect(encryptMock).toHaveBeenCalledWith('1234');
        expect(setState).toHaveBeenCalledWith(BiometricsState.InUse);
    });

    it('leaves the state untouched and informs the user when storing the key fails', async () => {
        encryptMock.mockRejectedValueOnce(new Error('keychain'));
        markBiometricsReenablePending();
        await offerBiometricsReenable('1234', setState);
        await pressEnable();
        expect(setState).not.toHaveBeenCalled();
        expect(alertMock).toHaveBeenCalledTimes(2);
    });
});
