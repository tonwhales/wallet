import { SolanaOrder } from "../ops/Order";
import { SolanaClient } from "../../../engine/hooks/solana/useSolanaClient";
import { AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { ThemeType } from "../../../engine/state/theme";
import { Keypair, Transaction, PublicKey, SystemProgram, TransactionInstruction, BlockhashWithExpiryBlockHeight } from "@solana/web3.js";
import { Account, createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { PendingSolanaTransaction, PendingTransactionStatus } from "../../../engine/state/pending";
import { isPublicKeyATA } from "../../../utils/solana/isPublicKeyATA";
import { createBackoffFailaible } from "../../../utils/time";
import { t } from "../../../i18n/t";
import { mapSolanaError, SendSolanaTransactionError } from "./mapSolanaError";

export type SendSolanaOrderParams = {
    sender: string,
    solanaClients: {
        client: SolanaClient,
        publicClient: SolanaClient
    },
    theme: ThemeType,
    authContext: AuthWalletKeysType,
    order: SolanaOrder
}

export const failableSolanaBackoff = createBackoffFailaible({
    logErrors: true,
    minDelay: 1500,
    maxDelay: 3000,
    maxFailureCount: 5,
    failTrigger: (e: any) => {
        if (e instanceof SendSolanaTransactionError && !e.isNetworkError) {
            return true;
        }
        return false;
    }
});

export async function signAndSendSolanaOrder({ solanaClients, theme, authContext, order, sender }: SendSolanaOrderParams): Promise<PendingSolanaTransaction> {
    const { target, comment, amount, token, reference } = order;
    const { client, publicClient } = solanaClients;
    const mintAddress = token ? new PublicKey(token.mint) : null;
    const owner = new PublicKey(sender);
    const recipient = new PublicKey(target);

    const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
    const keyPair = Keypair.fromSecretKey(new Uint8Array(walletKeys.keyPair.secretKey));

    const transaction = new Transaction();
    let lastBlockHash: BlockhashWithExpiryBlockHeight;
    try {
        lastBlockHash = await failableSolanaBackoff('getLatestBlockhash', () => client.getLatestBlockhash());
    } catch (error) {
        const mappedError = mapSolanaError(error);
        if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
            try {
                lastBlockHash = await failableSolanaBackoff('getLatestBlockhash', () => publicClient.getLatestBlockhash());
            } catch (error) {
                throw mapSolanaError(error);
            }
        } else {
            throw mappedError;
        }
    }

    let isATA: boolean | undefined;
    let recipientAddress: PublicKey | undefined;
    if (!mintAddress) { // generic solana transfer
        const instruction = SystemProgram.transfer({
            fromPubkey: owner,
            toPubkey: recipient,
            lamports: amount
        });

        if (reference) {
            instruction.keys.push(...reference.map(ref => ({ pubkey: ref, isSigner: false, isWritable: true })));
        }

        transaction.add(instruction);
    } else { // token transfer
        let senderTokenAccount: Account;

        try {
            senderTokenAccount = await failableSolanaBackoff('getOrCreateAssociatedTokenAccount', () => getOrCreateAssociatedTokenAccount(
                client,
                keyPair,
                mintAddress,
                owner
            ));
        } catch (error) {
            const mappedError = mapSolanaError(error);
            if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
                try {
                    senderTokenAccount = await failableSolanaBackoff('getOrCreateAssociatedTokenAccount', () => getOrCreateAssociatedTokenAccount(
                        publicClient,
                        keyPair,
                        mintAddress,
                        owner
                    ));
                } catch (error) {
                    throw mapSolanaError(error);
                }
            } else {
                throw mappedError;
            }
        }

        try {
            isATA = await failableSolanaBackoff('isPublicKeyATA', () => isPublicKeyATA({ solanaClient: client, address: recipient, mint: mintAddress }));
        } catch (error) {
            const mappedError = mapSolanaError(error);
            if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
                try {
                    isATA = await failableSolanaBackoff('isPublicKeyATA', () => isPublicKeyATA({ solanaClient: publicClient, address: recipient, mint: mintAddress }));
                } catch (error) {
                    throw mapSolanaError(error);
                }
            } else {
                throw mappedError;
            }
        }

        if (!isATA) {
            try {
                recipientAddress = (await failableSolanaBackoff('getOrCreateAssociatedTokenAccount', () => getOrCreateAssociatedTokenAccount(
                    client,
                    keyPair,
                    mintAddress,
                    recipient
                ))).address;
            } catch (error) {
                const mappedError = mapSolanaError(error);
                if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
                    try {
                        recipientAddress = (await failableSolanaBackoff('getOrCreateAssociatedTokenAccount', () => getOrCreateAssociatedTokenAccount(
                            publicClient,
                            keyPair,
                            mintAddress,
                            recipient
                        ))).address;
                    } catch (error) {
                        throw mapSolanaError(error);
                    }
                } else {
                    throw mappedError;
                }
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

        if (reference) {
            transferInstruction.keys.push(...reference.map(ref => ({ pubkey: ref, isSigner: false, isWritable: true })));
        }

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
    try {
        transaction.sign(keyPair);
    } catch {
        throw new SendSolanaTransactionError(t('transfer.solana.error.signingFailed'));
    }

    const recipientAddressString = recipient.toString();
    const _recipientAddressString = recipientAddressString.slice(0, 4) + '...' + recipientAddressString.slice(-4);

    let signature: string;
    try {
        signature = await failableSolanaBackoff('sendEncodedTransaction', async () => {
            try {
                return await client.sendEncodedTransaction(transaction.serialize().toString('base64'));
            } catch (error) {
                throw mapSolanaError(error, _recipientAddressString);
            }
        });
    } catch (error) {
        const mappedError = mapSolanaError(error, _recipientAddressString);
        if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
            try {
                signature = await failableSolanaBackoff('sendEncodedTransactionPub', () => publicClient.sendEncodedTransaction(transaction.serialize().toString('base64')));
            } catch (error) {
                throw mapSolanaError(error, _recipientAddressString);
            }
        } else {
            throw mappedError;
        }
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
            sender,
            tokenAccount: isATA ? recipientAddress?.toString() : undefined
        }
    };
}