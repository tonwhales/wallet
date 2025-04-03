import { SolanaOrder } from "../ops/Order";
import { SolanaClient } from "../../../engine/hooks/solana/useSolanaClient";
import { AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { ThemeType } from "../../../engine/state/theme";
import { Keypair, Transaction, PublicKey, SystemProgram, TransactionInstruction, SendTransactionError, Blockhash, BlockhashWithExpiryBlockHeight } from "@solana/web3.js";
import { Account, createTransferInstruction, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PendingSolanaTransaction, PendingTransactionStatus } from "../../../engine/state/pending";
import { isPublicKeyATA } from "../../../utils/solana/isPublicKeyATA";
import { createBackoffFailaible } from "../../../utils/time";
import { t } from "../../../i18n/t";
import { fromBnWithDecimals } from "../../../utils/withDecimals";

type SendSolanaOrderParams = {
    sender: string,
    solanaClient: SolanaClient,
    theme: ThemeType,
    authContext: AuthWalletKeysType,
    order: SolanaOrder
}

export const failableSolanaBackoff = createBackoffFailaible({
    logErrors: true,
    minDelay: 1500,
    maxDelay: 3000,
    maxFailureCount: 5
});

class SendSolanaTransactionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SendSolanaTransactionError';
    }
}

const solTransferLogKey = 'Transfer: insufficient lamports';

export function mapNetworkError(error: any) {
    if (!!error.statusCode) {
        if (error.statusCode === 429) {
            return new SendSolanaTransactionError(t('transfer.solana.error.rateLimited'));
        }
    }
    if (error.message.toLowerCase().includes('network request failed')) {
        return new SendSolanaTransactionError(t('transfer.solana.error.networkRequestFailed'));
    } else if (error.message.toLowerCase().includes('connection timed out')) {
        return new SendSolanaTransactionError(t('transfer.solana.error.connectionTimeout'));
    } else if (error.message.toLowerCase().includes('connection refused')) {
        return new SendSolanaTransactionError(t('transfer.solana.error.connectionRefused'));
    } else if (error.message.toLowerCase().includes('connection reset')) {
        return new SendSolanaTransactionError(t('transfer.solana.error.connectionReset'));
    }
    return error;
}

export function mapTransferError(error: SendTransactionError) {
    // check for insufficient lamports
    if (error.message.toLowerCase().includes('attempt to debit an account but found no record of a prior credit')) {
        return new SendSolanaTransactionError(t('transfer.solana.error.insufficientLamports'));
    } else if (error.message.toLowerCase().includes('error processing instruction')) {
        const logs = error.logs;
        if (logs) {
            const transferLog = logs.find(log => log.toLowerCase().includes(solTransferLogKey));
            if (transferLog) {
                const amountsString = transferLog.split(solTransferLogKey)[1];
                if (amountsString) {
                    const balances = amountsString.split(', need');
                    const balance = balances[0];
                    const need = balances[1];
                    const amount = BigInt(need) - BigInt(balance);
                    const amountString = `${fromBnWithDecimals(amount, 9)} SOL`;
                    if (balance && need) {
                        return new SendSolanaTransactionError(t('transfer.solana.error.insufficientLamportsWithAmount', { amount: amountString }));
                    }
                }
            }

            const tokenTransferLog = logs.find(log => log.includes(TOKEN_PROGRAM_ID.toBase58()));
            if (tokenTransferLog) {
                const insufficientFundsLog = logs.find(log => log.toLowerCase().includes('insufficient funds'));
                if (insufficientFundsLog) {
                    return new SendSolanaTransactionError(t('transfer.solana.error.insufficientTokenFunds'));
                }
            }
            return new SendSolanaTransactionError(t('transfer.solana.error.insufficientLamports'));
        }
    }

    return mapNetworkError(error);
}

export function mapSolanaError(error: any) {
    if (error instanceof SendTransactionError) {
        return mapTransferError(error);
    }
    return mapNetworkError(error);
}

export async function signAndSendSolanaOrder({ solanaClient, theme, authContext, order, sender }: SendSolanaOrderParams): Promise<PendingSolanaTransaction> {
    const { target, comment, amount, token } = order;
    const mintAddress = token ? new PublicKey(token.mint) : null;
    const owner = new PublicKey(sender);
    const recipient = new PublicKey(target);

    const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
    const keyPair = Keypair.fromSecretKey(new Uint8Array(walletKeys.keyPair.secretKey));

    const transaction = new Transaction();
    let lastBlockHash: BlockhashWithExpiryBlockHeight;
    try {
        lastBlockHash = await failableSolanaBackoff('getLatestBlockhash', () => solanaClient.getLatestBlockhash());
    } catch (error) {
        throw mapSolanaError(error);
    }

    if (!mintAddress) { // generic solana transfer
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: owner,
                toPubkey: recipient,
                lamports: amount
            })
        );
    } else { // token transfer
        let senderTokenAccount: Account;

        try {
            senderTokenAccount = await failableSolanaBackoff('getOrCreateAssociatedTokenAccount', () => getOrCreateAssociatedTokenAccount(
                solanaClient,
                keyPair,
                mintAddress,
                owner
            ));
        } catch (error) {
            throw mapSolanaError(error);
        }

        let isATA: boolean;
        try {
            isATA = await failableSolanaBackoff('isPublicKeyATA', () => isPublicKeyATA({ solanaClient, address: recipient, mint: mintAddress }));
        } catch (error) {
            throw mapSolanaError(error);
        }

        let recipientAddress: PublicKey;

        if (!isATA) {
            try {
                recipientAddress = (await failableSolanaBackoff('getOrCreateAssociatedTokenAccount', () => getOrCreateAssociatedTokenAccount(
                    solanaClient,
                    keyPair,
                    mintAddress,
                    recipient
                ))).address;
            } catch (error) {
                throw mapSolanaError(error);
            }
        } else {
            recipientAddress = recipient;
        }

        const transferInstruction = createTransferInstruction(
            senderTokenAccount.address, // from 
            recipientAddress, // to
            owner,
            amount
        );

        transaction.add(transferInstruction);
    }

    if (comment) {
        transaction.add(
            new TransactionInstruction({
                keys: [{ pubkey: owner, isSigner: true, isWritable: true }],
                data: Buffer.from(comment, "utf-8"),
                programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
            })
        );
    }

    transaction.feePayer = owner;
    transaction.recentBlockhash = lastBlockHash.blockhash;

    // 
    // Sign and send
    //
    transaction.sign(keyPair);

    let signature: string;
    try {
        signature = await failableSolanaBackoff('sendEncodedTransaction', () => solanaClient.sendEncodedTransaction(transaction.serialize().toString('base64')));
    } catch (error) {
        throw mapSolanaError(error);
    }

    return {
        type: 'tx',
        id: signature,
        time: Math.floor(Date.now() / 1000),
        status: PendingTransactionStatus.Pending,
        lastBlockHash,
        tx: {
            comment,
            amount,
            token,
            target,
            sender
        }
    };
}