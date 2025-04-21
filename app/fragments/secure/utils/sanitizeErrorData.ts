export function sanitizeErrorData(input: string): string {
    if (!input) return input;

    // clear hex strings with separators from 20 characters onwards
    // with 0x prefix
    let sanitized = input.replace(/0x[0-9A-Fa-f][ -:]{1,2}[0-9A-Fa-f]{20,}/g, "[hex_string_data]");
    // without 0x prefix
    sanitized = sanitized.replace(/[0-9A-Fa-f][ -:]{1,2}[0-9A-Fa-f]{20,}/g, "[hex_string_data]");
    // base58 strings from 20 characters onwards
    sanitized = sanitized.replace(/[1-9A-HJ-NP-Za-km-z]{20,}/g, "[base58_string_data]");
    // Uint8Array objects
    if (sanitized.length > 0 && /^[\d,]+$/.test(sanitized) && sanitized.includes(',')) {
        return "[uint8array_object]";
    }
    return sanitized;
}