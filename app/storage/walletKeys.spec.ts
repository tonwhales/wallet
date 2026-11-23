import { decryptData } from './secureStorage';
import {
    SecureAuthenticationCancelledError,
    SecureBiometricKeyInvalidatedError,
    SecureFailedLoadKeysError,
    loadWalletKeys
} from './walletKeys';

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('@ton/crypto', () => ({ mnemonicToWalletKey: jest.fn() }));
jest.mock('./secureStorage', () => {
    class BiometricKeyUnavailableError extends Error { }
    return { BiometricKeyUnavailableError, decryptData: jest.fn() };
});

const decryptMock = decryptData as jest.MockedFunction<typeof decryptData>;
const { BiometricKeyUnavailableError } = jest.requireMock('./secureStorage');

describe('loadWalletKeys', () => {
    it('maps unavailable biometric key to invalidated error that is still a load failure', async () => {
        decryptMock.mockRejectedValueOnce(new BiometricKeyUnavailableError());
        const result = loadWalletKeys(Buffer.from([]));
        await expect(result).rejects.toBeInstanceOf(SecureBiometricKeyInvalidatedError);
        await expect(result).rejects.toBeInstanceOf(SecureFailedLoadKeysError);
    });

    it('does not classify generic failures as invalidated key', async () => {
        decryptMock.mockRejectedValueOnce(new Error('Broken keystore'));
        const result = loadWalletKeys(Buffer.from([]));
        await expect(result).rejects.toBeInstanceOf(SecureFailedLoadKeysError);
        await expect(result).rejects.not.toBeInstanceOf(SecureBiometricKeyInvalidatedError);
    });

    it('keeps user cancellation separate from invalidated key', async () => {
        decryptMock.mockRejectedValueOnce(new Error('User canceled the operation'));
        const result = loadWalletKeys(Buffer.from([]));
        await expect(result).rejects.toBeInstanceOf(SecureAuthenticationCancelledError);
        await expect(result).rejects.not.toBeInstanceOf(SecureBiometricKeyInvalidatedError);
    });
});
