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

/**
 * Sanitize URL query parameters that might contain secrets
 * Replaces long alphanumeric values in query strings with placeholders
 */
function sanitizeUrlParams(input: string): string {
    // Match URLs with query parameters
    return input.replace(
        /(https?:\/\/[^\s?#]*)\?([^\s#]*)/gi,
        (match, baseUrl, queryString) => {
            // Sanitize individual query parameters
            const sanitizedParams = queryString.replace(
                /([^=&]+)=([^&]*)/g,
                (paramMatch: string, key: string, value: string) => {
                    // Sanitize long alphanumeric values (potential tokens/sessions)
                    if (value.length >= 20 && /^[A-Za-z0-9_\-+/=]+$/.test(value)) {
                        return `${key}=[secret_param]`;
                    }
                    return paramMatch;
                }
            );
            return `${baseUrl}?${sanitizedParams}`;
        }
    );
}

/**
 * Sanitize URL path segments that might contain session IDs or secrets
 * e.g., /connect/{session_id} -> /connect/[secret_path]
 */
function sanitizeUrlPaths(input: string): string {
    // Match URLs and sanitize long path segments that look like tokens
    return input.replace(
        /(https?:\/\/[^\s]*)/gi,
        (url) => {
            try {
                // Split URL into parts
                const questionIndex = url.indexOf('?');
                const hashIndex = url.indexOf('#');
                let pathEnd = url.length;
                if (questionIndex !== -1) pathEnd = Math.min(pathEnd, questionIndex);
                if (hashIndex !== -1) pathEnd = Math.min(pathEnd, hashIndex);

                const pathPart = url.substring(0, pathEnd);
                const rest = url.substring(pathEnd);

                // Sanitize path segments that look like secrets (long base64/alphanumeric)
                const sanitizedPath = pathPart.replace(
                    /\/([A-Za-z0-9_\-+/=]{20,})/g,
                    '/[secret_path]'
                );

                return sanitizedPath + rest;
            } catch {
                return url;
            }
        }
    );
}

export function sanitizeErrorData(input: string): string {
    if (!input) return input;

    let sanitized = input;

    // First sanitize URLs (before other patterns might corrupt them)
    sanitized = sanitizeUrlPaths(sanitized);
    sanitized = sanitizeUrlParams(sanitized);

    sanitized = sanitized
        // hex with 0x prefix, 20+ chars
        .replace(/0x[0-9A-Fa-f]{20,}/g, "[hex_string_data]")
        // hex with separators (like MAC addresses, but longer)
        .replace(/(?:[0-9A-Fa-f]{2}(?:(?::| |-)[0-9A-Fa-f]{2}){9,})/g, "[hex_string_data]")
        // pure hex, 40+ chars (to avoid false positives, increased threshold)
        .replace(/\b[0-9A-Fa-f]{40,}\b/g, "[hex_string_data]")
        // base64 strings, 32+ chars (session tokens, keys, etc.)
        .replace(/\b[A-Za-z0-9+/]{32,}={0,2}(?![A-Za-z0-9+/=])/g, "[base64_string_data]")
        // base58, 32+ chars (increased threshold to avoid false positives)
        .replace(/\b[1-9A-HJ-NP-Za-km-z]{32,}\b/g, "[base58_string_data]")
        // uint8array representation, 20+ elements
        .replace(/\d{1,3}(?:,\d{1,3}){19,}/g, "[uint8array_object]");

    // Remove potential seed phrases
    sanitized = removeSeedPhrases(sanitized);

    return sanitized;
}