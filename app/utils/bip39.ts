import { getSecureRandomBytes } from '@ton/crypto';
import { sha256 } from '@noble/hashes/sha256';
import { wordlist } from '@ton/crypto/dist/mnemonic/wordlist';
import { mnemonicValidate } from '@ton/crypto';

export type MnemonicLength = 12 | 24;

/**
 * Generate BIP39 mnemonic from entropy
 * @param entropyBytes - 16 bytes for 12 words, 32 bytes for 24 words
 */
function entropyToMnemonic(entropyBytes: Buffer): string[] {
    const entropyBits = entropyBytes.length * 8;
    const checksumBits = entropyBits / 32;

    // Calculate SHA256 checksum
    const hash = sha256(entropyBytes);
    const hashBits = Array.from(hash)
        .map(byte => byte.toString(2).padStart(8, '0'))
        .join('');

    // Combine entropy + checksum bits
    const entropyBitString = Array.from(entropyBytes)
        .map(byte => byte.toString(2).padStart(8, '0'))
        .join('');
    const allBits = entropyBitString + hashBits.slice(0, checksumBits);

    // Split into 11-bit chunks and map to words
    const words: string[] = [];
    for (let i = 0; i < allBits.length; i += 11) {
        const chunk = allBits.slice(i, i + 11);
        const index = parseInt(chunk, 2);
        words.push(wordlist[index]);
    }

    return words;
}

/**
 * Generate BIP39 mnemonic
 */
export async function generateBip39Mnemonic(wordCount: MnemonicLength): Promise<string[]> {
    const entropyBytes = wordCount === 12 ? 16 : 32;
    const entropy = await getSecureRandomBytes(entropyBytes);
    return entropyToMnemonic(entropy);
}

export type UniversalMnemonicResult = {
    mnemonic: string[];
    attempts: number;
    isTonValid: boolean;
};

/**
 * Generate BIP39 mnemonic that is also valid for TON
 * TON validates by checking HMAC_SHA512("TON Mnemonic Check", mnemonic)[0] == 0x00
 * Probability of success per attempt: 1/256 (~0.39%)
 * Probability of failure after 1000 attempts: ~0.02%
 */
export async function generateUniversalMnemonic(wordCount: MnemonicLength): Promise<UniversalMnemonicResult> {
    let attempts = 0;
    const maxAttempts = 1000;

    while (attempts < maxAttempts) {
        attempts++;
        const mnemonic = await generateBip39Mnemonic(wordCount);

        // Check if valid for TON
        const isTonValid = await mnemonicValidate(mnemonic);
        if (isTonValid) {
            return { mnemonic, attempts, isTonValid: true };
        }
    }

    // If we couldn't find a TON-valid mnemonic, return the last one as BIP39-only
    const mnemonic = await generateBip39Mnemonic(wordCount);
    return { mnemonic, attempts, isTonValid: false };
}

/**
 * Validate if a mnemonic is BIP39 compatible
 */
export function validateBip39Mnemonic(mnemonic: string[]): boolean {
    // Check word count
    if (mnemonic.length !== 12 && mnemonic.length !== 24) {
        return false;
    }

    // Check all words are in wordlist
    for (const word of mnemonic) {
        if (!wordlist.includes(word)) {
            return false;
        }
    }

    return true;
}

