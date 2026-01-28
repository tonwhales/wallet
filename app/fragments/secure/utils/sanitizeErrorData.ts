import { wordlist } from '@ton/crypto/dist/mnemonic/wordlist';

// Create a Set for O(1) lookup of BIP39 words
const bip39WordSet = new Set(wordlist);

/**
 * Check if a sequence of words looks like a seed phrase
 * Returns true if all words are valid BIP39 words
 */
function isSeedPhrase(words: string[]): boolean {
    if (words.length !== 12 && words.length !== 24) {
        return false;
    }
    // All words must be valid BIP39 words
    return words.every(word => bip39WordSet.has(word.toLowerCase()));
}

/**
 * Remove potential seed phrases (12 or 24 BIP39 words) from input
 */
function removeSeedPhrases(input: string): string {
    // Match sequences of 12 or 24 words (letters only, separated by spaces/newlines)
    // This regex finds sequences of words that could be seed phrases
    const wordPattern = /\b([a-zA-Z]+(?:[\s\n]+[a-zA-Z]+){11}(?:(?:[\s\n]+[a-zA-Z]+){12})?)\b/g;

    return input.replace(wordPattern, (match) => {
        const words = match.trim().split(/[\s\n]+/);

        // Check for exactly 12 or 24 words
        if (words.length === 12 || words.length === 24) {
            if (isSeedPhrase(words)) {
                return '[seed_phrase_removed]';
            }
        }

        // Not a seed phrase, return original
        return match;
    });
}

export function sanitizeErrorData(input: string): string {
    if (!input) return input;

    let sanitized = input
        // hex, separators, 20+ chars
        .replace(/0x[0-9A-Fa-f]{20,}/g, "[hex_string_data]")
        // base58, 20+ chars
        .replace(/(?:[0-9A-Fa-f]{2}(?:(?::| |-)[0-9A-Fa-f]{2}){9,}|[0-9A-Fa-f]{20,})/g, "[hex_string_data]")
        // base58, 20+ chars
        .replace(/[1-9A-HJ-NP-Za-km-z]{20,}/g, "[base58_string_data]")
        // uint8array, 20+ chars
        .replace(/\d{1,3}(?:,\d{1,3}){19,}/g, "[uint8array_object]");

    // Remove potential seed phrases
    sanitized = removeSeedPhrases(sanitized);

    return sanitized;
}