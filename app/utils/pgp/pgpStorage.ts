import { storage } from '../../storage/storage';
import { encryptData, decryptData, PasscodeState, getPasscodeState, BiometricsState, getBiometricsState } from '../../storage/secureStorage';
import { PGPKeyPair } from './types';
import { generatePGPKeyPair } from './pgpUtils';

const PGP_KEYPAIR_KEY = 'pgp-keypair-encrypted';

/**
 * Check if PGP keypair exists in storage
 */
export function hasPGPKeyPair(): boolean {
    return storage.getString(PGP_KEYPAIR_KEY) !== undefined;
}

/**
 * Save PGP keypair to secure storage
 * @param keyPair - The PGP keypair to save
 * @param passcode - Optional passcode for encryption (uses biometrics if not provided)
 */
export async function savePGPKeyPair(keyPair: PGPKeyPair, passcode?: string): Promise<void> {
    const data = JSON.stringify(keyPair);

    const passcodeState = getPasscodeState();
    const biometricsState = getBiometricsState();
    const useBiometrics = biometricsState === BiometricsState.InUse;

    let encrypted: Buffer;

    if (passcode) {
        // Encrypt with provided passcode
        encrypted = await encryptData(Buffer.from(data), passcode);
    } else if (useBiometrics) {
        // Encrypt with biometrics
        encrypted = await encryptData(Buffer.from(data));
    } else if (passcodeState === PasscodeState.Set) {
        // This case requires passcode but none was provided
        throw new Error('Passcode required for encryption');
    } else {
        throw new Error('No encryption method available');
    }

    storage.set(PGP_KEYPAIR_KEY, encrypted.toString('base64'));
}

/**
 * Load PGP keypair from secure storage
 * Requires biometrics/passcode authentication
 */
export async function loadPGPKeyPair(passcode?: string): Promise<PGPKeyPair | null> {
    const encryptedBase64 = storage.getString(PGP_KEYPAIR_KEY);
    if (!encryptedBase64) {
        return null;
    }

    try {
        const encrypted = Buffer.from(encryptedBase64, 'base64');
        const decrypted = await decryptData(encrypted, passcode);
        return JSON.parse(decrypted.toString()) as PGPKeyPair;
    } catch {
        return null;
    }
}

/**
 * Generate and save a new PGP keypair
 * @param passcode - Optional passcode for encryption (uses biometrics if not provided)
 */
export async function generateAndSavePGPKeyPair(passcode?: string): Promise<PGPKeyPair> {
    const keyPair = await generatePGPKeyPair();
    await savePGPKeyPair(keyPair, passcode);
    return keyPair;
}

/**
 * Delete PGP keypair from storage
 */
export function deletePGPKeyPair(): void {
    storage.delete(PGP_KEYPAIR_KEY);
}
