import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { t } from "../../../i18n/t";
import { fromBnWithDecimals, toBnWithDecimals } from "../../../utils/withDecimals";
import { sanitizeErrorData } from "./sanitizeErrorData";
import { Connection, SendTransactionError } from "@solana/web3.js";
import { messageContains, messageContainsAny, findLogContaining, extractCustomProgramErrorCode, SolanaErrorKey } from "./matchSolanaErrorKey";

export class SendSolanaTransactionError extends Error {
    isNetworkError?: boolean;
    needLamports?: boolean;
    lamportsNeeded?: bigint;
    rentNeeded?: bigint;
    logs?: string[];

    constructor(
        message: string,
        options?: {
            isNetworkError?: boolean;
            lamportsNeeded?: bigint;
            rentNeeded?: bigint;
            logs?: string[];
        }
    ) {
        const sanitizedMessage = sanitizeErrorData(message);
        super(sanitizedMessage);
        this.name = 'SendSolanaTransactionError';
        this.isNetworkError = options?.isNetworkError;
        this.lamportsNeeded = options?.lamportsNeeded;
        this.rentNeeded = options?.rentNeeded;
        this.logs = options?.logs;
    }
}

/**
 * Format error message with logs if available
 */
function formatMessageWithLogs(message: string, logs?: string[]): string {
    if (!logs || logs.length === 0) {
        return message;
    }
    // Filter out empty logs and limit to most relevant ones
    const relevantLogs = logs
        .filter(log => log.trim().length > 0)
        .slice(-5); // Keep last 5 logs (most relevant)

    if (relevantLogs.length === 0) {
        return message;
    }

    return `${message}\n\n${relevantLogs.join('\n')}`;
}

export function mapNetworkError(error: any) {
    const message = error.message || '';

    if (!!error.statusCode) {
        if (error.statusCode === 429) {
            return new SendSolanaTransactionError(t('transfer.solana.error.rateLimited'), { isNetworkError: true });
        }
    }

    if (messageContains(message, SolanaErrorKey.NetworkRequestFailed)) {
        return new SendSolanaTransactionError(t('transfer.solana.error.networkRequestFailed'), { isNetworkError: true });
    }
    if (messageContains(message, SolanaErrorKey.ConnectionTimedOut)) {
        return new SendSolanaTransactionError(t('transfer.solana.error.connectionTimeout'), { isNetworkError: true });
    }
    if (messageContains(message, SolanaErrorKey.ConnectionRefused)) {
        return new SendSolanaTransactionError(t('transfer.solana.error.connectionRefused'), { isNetworkError: true });
    }
    if (messageContains(message, SolanaErrorKey.ConnectionReset)) {
        return new SendSolanaTransactionError(t('transfer.solana.error.connectionReset'), { isNetworkError: true });
    }
    if (messageContainsAny(message, [SolanaErrorKey.BlockhashNotFound, SolanaErrorKey.BlockhashExpired])) {
        return new SendSolanaTransactionError(t('transfer.solana.error.blockhashExpired'), { isNetworkError: true });
    }

    return error;
}

export async function mapTransferError(error: SendTransactionError, connection: Connection) {
    const message = error.message || '';
    let logs: string[] = [];
    try {
        logs = await error.getLogs(connection);
    } catch {
        logs = error.logs || [];
    }
    const logsJoined = logs.join(' ');

    // Check for blockhash expired
    if (messageContainsAny(message, [SolanaErrorKey.BlockhashNotFound, SolanaErrorKey.BlockhashExpired])) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.blockhashExpired'), logs),
            { isNetworkError: true, logs }
        );
    }

    // Check for account not found
    if (messageContainsAny(message, [SolanaErrorKey.AccountNotFound, SolanaErrorKey.AccountDoesNotExist])) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.accountNotFound'), logs),
            { logs }
        );
    }

    // Check for insufficient funds for fee
    if (messageContains(message, SolanaErrorKey.InsufficientFundsForFee) || messageContains(logsJoined, SolanaErrorKey.InsufficientFundsForFee)) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.insufficientFundsForFee'), logs),
            { logs }
        );
    }

    // Check for transaction too large
    if (messageContains(message, SolanaErrorKey.TransactionTooLarge)) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.transactionTooLarge'), logs),
            { logs }
        );
    }

    // Check for duplicate transaction
    if (messageContainsAny(message, [SolanaErrorKey.AlreadyProcessed, SolanaErrorKey.DuplicateSignature])) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.duplicateTransaction'), logs),
            { logs }
        );
    }

    // Check for error processing instruction (detailed parsing)
    if (messageContains(message, SolanaErrorKey.ErrorProcessingInstruction)) {
        if (logs.length > 0) {
            // Check for insufficient lamports in transfer
            const transferLog = findLogContaining(logs, SolanaErrorKey.SolTransferInsufficientLamports);
            if (transferLog) {
                const amountsString = transferLog.split(SolanaErrorKey.SolTransferInsufficientLamports)[1];
                if (amountsString) {
                    const balances = amountsString.split(', need');
                    const balance = balances[0];
                    const need = balances[1];
                    const amount = BigInt(need) - BigInt(balance);
                    const amountString = `${fromBnWithDecimals(amount, 9)} SOL`;
                    if (balance && need) {
                        return new SendSolanaTransactionError(
                            formatMessageWithLogs(t('transfer.solana.error.insufficientLamportsWithAmount', { amount: amountString }), logs),
                            { lamportsNeeded: amount, logs }
                        );
                    }
                }
            }

            // Check for insufficient token funds
            const tokenTransferLog = logs.find(log => log.includes(TOKEN_PROGRAM_ID.toBase58()));
            if (tokenTransferLog) {
                const insufficientFundsLog = findLogContaining(logs, SolanaErrorKey.InsufficientFunds);
                if (insufficientFundsLog) {
                    return new SendSolanaTransactionError(
                        formatMessageWithLogs(t('transfer.solana.error.insufficientTokenFunds'), logs),
                        { logs }
                    );
                }
            }

            // Check for custom program error
            const customErrorLog = findLogContaining(logs, SolanaErrorKey.CustomProgramError);
            if (customErrorLog) {
                const errorCode = extractCustomProgramErrorCode(customErrorLog);
                if (errorCode) {
                    return new SendSolanaTransactionError(
                        formatMessageWithLogs(t('transfer.solana.error.customProgramError', { code: errorCode }), logs),
                        { logs }
                    );
                }
                return new SendSolanaTransactionError(
                    formatMessageWithLogs(t('transfer.solana.error.customProgramError', { code: 'unknown' }), logs),
                    { logs }
                );
            }

            // Return logs as error message for unhandled cases
            return new SendSolanaTransactionError(logs.join('\n'), { logs });
        }
    }

    // Check for InsufficientFundsForRent
    if (error instanceof SendTransactionError && error.transactionError?.message?.includes(SolanaErrorKey.InsufficientFundsForRent)) {
        try {
            const amount = error.transactionError.message.split(SolanaErrorKey.InsufficientFundsForRent)[1];
            const rent = toBnWithDecimals(amount, 9);
            return new SendSolanaTransactionError(
                formatMessageWithLogs(t('transfer.solana.error.title'), logs),
                { rentNeeded: rent, logs }
            );
        } catch {
            return new SendSolanaTransactionError(
                formatMessageWithLogs(t('transfer.solana.error.title'), logs),
                { logs }
            );
        }
    }

    // Check for general insufficient lamports (including account not initialized)
    if (
        messageContains(message, SolanaErrorKey.InsufficientLamports) ||
        messageContains(logsJoined, SolanaErrorKey.InsufficientLamports) ||
        messageContains(message, SolanaErrorKey.AccountNotInitialized)
    ) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.insufficientLamports'), logs),
            { logs }
        );
    }

    return mapNetworkError(error);
}

export async function mapSolanaError(error: any, connection: Connection) {
    // Handle SendTransactionError specifically
    if (error instanceof SendTransactionError) {
        return await mapTransferError(error, connection);
    }

    // Handle general errors with message parsing
    const message = error.message || '';
    const logs = error.logs || [];

    // Check for blockhash expired
    if (messageContainsAny(message, [SolanaErrorKey.BlockhashNotFound, SolanaErrorKey.BlockhashExpired])) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.blockhashExpired'), logs),
            { isNetworkError: true, logs }
        );
    }

    // Check for account not found
    if (messageContainsAny(message, [SolanaErrorKey.AccountNotFound, SolanaErrorKey.AccountDoesNotExist])) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.accountNotFound'), logs),
            { logs }
        );
    }

    // Check for insufficient funds for fee
    if (messageContains(message, SolanaErrorKey.InsufficientFundsForFee)) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.insufficientFundsForFee'), logs),
            { logs }
        );
    }

    // Check for transaction too large
    if (messageContains(message, SolanaErrorKey.TransactionTooLarge)) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.transactionTooLarge'), logs),
            { logs }
        );
    }

    // Check for duplicate transaction
    if (messageContainsAny(message, [SolanaErrorKey.AlreadyProcessed, SolanaErrorKey.DuplicateSignature])) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.duplicateTransaction'), logs),
            { logs }
        );
    }

    // Check for custom program error
    if (messageContains(message, SolanaErrorKey.CustomProgramError)) {
        const errorCode = extractCustomProgramErrorCode(message);
        if (errorCode) {
            return new SendSolanaTransactionError(
                formatMessageWithLogs(t('transfer.solana.error.customProgramError', { code: errorCode }), logs),
                { logs }
            );
        }
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.customProgramError', { code: 'unknown' }), logs),
            { logs }
        );
    }

    // Check for general insufficient lamports (including account not initialized)
    if (
        messageContains(message, SolanaErrorKey.InsufficientLamports) ||
        messageContains(message, SolanaErrorKey.AccountNotInitialized)
    ) {
        return new SendSolanaTransactionError(
            formatMessageWithLogs(t('transfer.solana.error.insufficientLamports'), logs),
            { logs }
        );
    }

    // Try to map as network error
    return mapNetworkError(error);
}
