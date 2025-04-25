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

    return sanitized;
}