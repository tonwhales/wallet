/**
 * Utility functions for matching Solana error messages by string keys
 */

/**
 * Solana error message keys for parsing
 */
export enum SolanaErrorKey {
    // Transfer errors
    SolTransferInsufficientLamports = 'Transfer: insufficient lamports',
    InsufficientFunds = 'insufficient funds',
    InsufficientFundsForRent = 'InsufficientFundsForRent:',
    InsufficientFundsForFee = 'insufficient funds for fee',
    InsufficientLamports = 'insufficient lamports',
    AccountNotInitialized = 'attempt to debit an account but found no record of a prior credit',

    // Blockhash errors
    BlockhashNotFound = 'blockhash not found',
    BlockhashExpired = 'blockhash expired',

    // Account errors
    AccountNotFound = 'account not found',
    AccountDoesNotExist = 'account does not exist',

    // Transaction errors
    CustomProgramError = 'custom program error',
    TransactionTooLarge = 'transaction too large',
    AlreadyProcessed = 'already been processed',
    DuplicateSignature = 'duplicate signature',

    // Network errors
    NetworkRequestFailed = 'network request failed',
    ConnectionTimedOut = 'connection timed out',
    ConnectionRefused = 'connection refused',
    ConnectionReset = 'connection reset',

    // Processing errors
    ErrorProcessingInstruction = 'error processing instruction',
}

/**
 * Check if a message contains a specific key (case-insensitive)
 */
export function messageContains(message: string, key: string): boolean {
    return message.toLowerCase().includes(key.toLowerCase());
}

/**
 * Check if a message contains any of the given keys (case-insensitive)
 */
export function messageContainsAny(message: string, keys: string[]): boolean {
    const lowerMessage = message.toLowerCase();
    return keys.some(key => lowerMessage.includes(key.toLowerCase()));
}

/**
 * Find the first log entry that contains the given key (case-insensitive)
 */
export function findLogContaining(logs: string[], key: string): string | undefined {
    return logs.find(log => log.toLowerCase().includes(key.toLowerCase()));
}

/**
 * Extract error code from a custom program error message
 * Returns the error code string (hex or decimal) if found
 */
export function extractCustomProgramErrorCode(message: string): string | null {
    const errorCodeMatch = message.match(/custom program error:\s*(0x[0-9a-fA-F]+|\d+)/i);
    return errorCodeMatch ? errorCodeMatch[1] : null;
}

