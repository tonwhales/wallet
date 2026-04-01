import OpenPGP, { Curve } from 'react-native-fast-openpgp';
import { getSecureRandomBytes } from '@ton/crypto';
import { PGPKeyPair, WalletExportData } from './types';

/**
 * Generate a random passphrase for PGP key
 */
async function generatePassphrase(): Promise<string> {
    const bytes = await getSecureRandomBytes(32);
    return bytes.toString('base64');
}

/**
 * Generate a new PGP keypair using Curve25519
 */
export async function generatePGPKeyPair(): Promise<PGPKeyPair> {
    const passphrase = await generatePassphrase();

    const { privateKey, publicKey } = await OpenPGP.generate({
        name: 'Tonhub Wallet',
        email: 'pgp@tonhub.com',
        passphrase,
        keyOptions: {
            curve: Curve.CURVE25519,
        },
    });

    return { privateKey, publicKey, passphrase };
}

/**
 * Encrypt wallet data with recipient's public key
 */
export async function encryptWalletData(
    data: WalletExportData,
    recipientPublicKeyArmored: string
): Promise<string> {
    const plaintext = JSON.stringify(data);
    const encrypted = await OpenPGP.encrypt(plaintext, recipientPublicKeyArmored);
    return encrypted;
}

/**
 * Decrypt wallet data with private key
 */
export async function decryptWalletData(
    encryptedMessage: string,
    privateKeyArmored: string,
    passphrase: string
): Promise<WalletExportData> {
    const decrypted = await OpenPGP.decrypt(encryptedMessage, privateKeyArmored, passphrase);
    const parsed = JSON.parse(decrypted) as WalletExportData;

    // Validate structure
    if (parsed.version !== 1 || !Array.isArray(parsed.wallets)) {
        throw new Error('Invalid wallet export data format');
    }

    return parsed;
}

/**
 * Validate if a string is a valid PGP public key
 */
export async function validatePGPPublicKey(armoredKey: string): Promise<boolean> {
    try {
        // Check if it looks like a PGP public key block
        const trimmed = armoredKey.trim();
        return trimmed.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----') &&
            trimmed.includes('-----END PGP PUBLIC KEY BLOCK-----');
    } catch {
        return false;
    }
}

/**
 * Validate if a string is a valid PGP encrypted message
 */
export async function validatePGPMessage(armoredMessage: string): Promise<boolean> {
    try {
        // Check if it looks like a PGP message
        const trimmed = armoredMessage.trim();
        return trimmed.includes('-----BEGIN PGP MESSAGE-----') &&
            trimmed.includes('-----END PGP MESSAGE-----');
    } catch {
        return false;
    }
}
