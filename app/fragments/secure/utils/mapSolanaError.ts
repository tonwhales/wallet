import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { t } from "../../../i18n/t";
import { fromBnWithDecimals, toBnWithDecimals } from "../../../utils/withDecimals";
import { sanitizeErrorData } from "./sanitizeErrorData";
import { SendTransactionError } from "@solana/web3.js";

const solTransferLogKey = 'Transfer: insufficient lamports';
const insufficientFundsLogKey = 'insufficient funds';
const insufficientFundsForRentMessage = 'InsufficientFundsForRent:';

export class SendSolanaTransactionError extends Error {
    isNetworkError?: boolean;
    needLamports?: boolean;
    lamportsNeeded?: bigint;
    rentNeeded?: bigint;
    constructor(message: string, isNetworkError?: boolean, lamportsNeeded?: bigint, rentNeeded?: bigint) {
        const sanitizedMessage = sanitizeErrorData(message);
        super(sanitizedMessage);
        this.name = 'SendSolanaTransactionError';
        this.isNetworkError = isNetworkError;
        this.lamportsNeeded = lamportsNeeded;
        this.rentNeeded = rentNeeded;
    }
}

export function mapNetworkError(error: any) {
    if (!!error.statusCode) {
        if (error.statusCode === 429) {
            return new SendSolanaTransactionError(t('transfer.solana.error.rateLimited'), true);
        }
    }
    if (error.message.toLowerCase().includes('network request failed')) {
        return new SendSolanaTransactionError(t('transfer.solana.error.networkRequestFailed'), true);
    } else if (error.message.toLowerCase().includes('connection timed out')) {
        return new SendSolanaTransactionError(t('transfer.solana.error.connectionTimeout'), true);
    } else if (error.message.toLowerCase().includes('connection refused')) {
        return new SendSolanaTransactionError(t('transfer.solana.error.connectionRefused'), true);
    } else if (error.message.toLowerCase().includes('connection reset')) {
        return new SendSolanaTransactionError(t('transfer.solana.error.connectionReset'), true);
    }
    return error;
}

export function mapTransferError(error: SendTransactionError, recipientAddress?: string) {
    // check for insufficient lamports
    if (error.message.toLowerCase().includes('attempt to debit an account but found no record of a prior credit')) {
        return new SendSolanaTransactionError(t('transfer.solana.error.insufficientLamports'));
    } else if (error.message.toLowerCase().includes('error processing instruction')) {
        const logs = error.logs;
        if (logs) {
            const transferLog = logs.find(log => log.toLowerCase().includes(solTransferLogKey.toLowerCase()));
            if (transferLog) {
                const amountsString = transferLog.split(solTransferLogKey)[1];
                if (amountsString) {
                    const balances = amountsString.split(', need');
                    const balance = balances[0];
                    const need = balances[1];
                    const amount = BigInt(need) - BigInt(balance);
                    const amountString = `${fromBnWithDecimals(amount, 9)} SOL`;
                    if (balance && need) {
                        return new SendSolanaTransactionError(t('transfer.solana.error.insufficientLamportsWithAmount', { amount: amountString }), false, amount);
                    }
                }
            }

            const tokenTransferLog = logs.find(log => log.includes(TOKEN_PROGRAM_ID.toBase58()));
            if (tokenTransferLog) {
                const insufficientFundsLog = logs.find(log => log.toLowerCase().includes(insufficientFundsLogKey.toLowerCase()));
                if (insufficientFundsLog) {
                    return new SendSolanaTransactionError(t('transfer.solana.error.insufficientTokenFunds'));
                }
            }
            return new SendSolanaTransactionError(logs.join('\n'));
        }
    } else if (error instanceof SendTransactionError && error.transactionError?.message?.includes(insufficientFundsForRentMessage)) {
        try {
            const amount = error.transactionError.message.split(insufficientFundsForRentMessage)[1];
            const rent = toBnWithDecimals(amount, 9);
            return new SendSolanaTransactionError(t('transfer.solana.error.title'), false, undefined, rent);
        } catch (error) {
            return new SendSolanaTransactionError(t('transfer.solana.error.title'));
        }
    }

    return mapNetworkError(error);
}

export function mapSolanaError(error: any, recipientAddress?: string) {
    if (error instanceof SendTransactionError) {
        return mapTransferError(error, recipientAddress);
    }
    return mapNetworkError(error);
}