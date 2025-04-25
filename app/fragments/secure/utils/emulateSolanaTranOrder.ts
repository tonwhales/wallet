import { failableSolanaBackoff, SendSolanaOrderParams } from "./signAndSendSolanaOrder";
import { PublicKey, Transaction, TransactionInstruction, SystemProgram, BlockhashWithExpiryBlockHeight, SendTransactionError } from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { isPublicKeyATA } from "../../../utils/solana/isPublicKeyATA";
import { fromNano } from "@ton/core";
import { mapSolanaError, SendSolanaTransactionError } from "./mapSolanaError";

export async function emulateSolanaTranOrder({ order, solanaClients, sender }: Omit<SendSolanaOrderParams, 'theme' | 'authContext'>) {
    const { target, comment, amount, token, reference } = order;
    const { client, publicClient } = solanaClients;
    const mintAddress = token ? new PublicKey(token.mint) : null;
    const owner = new PublicKey(sender);
    const recipient = new PublicKey(target);

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
        let senderTokenAccount: PublicKey;

        try {
            senderTokenAccount = await failableSolanaBackoff('getOrCreateAssociatedTokenAccount', () => getAssociatedTokenAddress(
                mintAddress,
                owner
            ));
        } catch (error) {
            const mappedError = mapSolanaError(error);
            if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
                try {
                    senderTokenAccount = await failableSolanaBackoff('getOrCreateAssociatedTokenAccount', () => getAssociatedTokenAddress(
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

        let isATA: boolean;
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

        let recipientAddress: PublicKey;

        if (!isATA) {
            try {
                recipientAddress = (await failableSolanaBackoff('getOrCreateAssociatedTokenAccount', () => getAssociatedTokenAddress(
                    mintAddress,
                    recipient
                )));
            } catch (error) {
                const mappedError = mapSolanaError(error);
                if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
                    try {
                        recipientAddress = (await failableSolanaBackoff('getOrCreateAssociatedTokenAccount', () => getAssociatedTokenAddress(
                            mintAddress,
                            recipient
                        )));
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
            senderTokenAccount, // from 
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

    const simulation = await client.simulateTransaction(transaction);
    if (simulation.value.err) {
        const logs = simulation.value.logs || [];
        let error = new SendTransactionError({
            action: 'simulate',
            signature: '',
            transactionMessage: JSON.stringify(simulation.value.err),
            logs
        });

        try {
            if (JSON.stringify(simulation.value.err).includes('InsufficientFundsForRent')) {
                const minRent = await client.getMinimumBalanceForRentExemption(128);
                const rent = BigInt(minRent);

                error = new SendTransactionError({
                    action: 'simulate',
                    signature: '',
                    transactionMessage: `InsufficientFundsForRent:${fromNano(rent)}`,
                    logs
                });
            }
        } catch { }

        const res = mapSolanaError(error);
        if (res instanceof SendSolanaTransactionError && (res.lamportsNeeded || res.rentNeeded)) {
            return res;
        }
    }

    return null;
}