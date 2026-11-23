import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { storage } from './storage';
import { BiometricKeyUnavailableError, getApplicationKey } from './secureStorage';

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn() }));
jest.mock('expo-local-authentication', () => ({}));
jest.mock('@ton/crypto', () => ({
    getSecureRandomBytes: jest.fn(),
    openBox: jest.fn(),
    pbkdf2_sha512: jest.fn(),
    sealBox: jest.fn()
}));
jest.mock('./modules/KeyStore', () => ({}));
jest.mock('./storage', () => ({
    storage: { getString: jest.fn(), getBoolean: jest.fn(), set: jest.fn() }
}));

const getItemMock = SecureStore.getItemAsync as jest.Mock;
const getStringMock = storage.getString as jest.Mock;

describe('getApplicationKey with secure-store', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getStringMock.mockImplementation((key: string) => {
            if (key === 'ton-storage-kind') {
                return 'secure-store';
            }
            if (key === 'ton-storage-ref') {
                return 'ref';
            }
            return undefined;
        });
    });

    it.each(['ios', 'android'] as const)('reports an unavailable biometric key when the item is gone on %s', async (os) => {
        (Platform as { OS: string }).OS = os;
        getItemMock.mockResolvedValueOnce(null);
        await expect(getApplicationKey()).rejects.toBeInstanceOf(BiometricKeyUnavailableError);
    });

    it('returns the stored key when it is available', async () => {
        getItemMock.mockResolvedValueOnce(Buffer.from('key').toString('base64'));
        await expect(getApplicationKey()).resolves.toEqual(Buffer.from('key'));
    });

    it('does not classify native read failures as an unavailable key', async () => {
        const nativeError = new Error('User canceled the operation');
        getItemMock.mockRejectedValueOnce(nativeError);
        await expect(getApplicationKey()).rejects.toBe(nativeError);
    });
});
