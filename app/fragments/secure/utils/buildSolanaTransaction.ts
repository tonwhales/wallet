import { PublicKey, Transaction, TransactionInstruction, SystemProgram, BlockhashWithExpiryBlockHeight, Keypair } from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, Account } from "@solana/spl-token";
import { SolanaOrder } from "../ops/Order";
import { SolanaClient } from "../../../engine/hooks/solana/useSolanaClient";
import { failableSolanaBackoff } from "./signAndSendSolanaOrder";
import { isPublicKeyATA } from "../../../utils/solana/isPublicKeyATA";
import { mapSolanaError, SendSolanaTransactionError } from "./mapSolanaError";

type BuildTransactionOptions = {
    order: SolanaOrder;
    sender: string;
    solanaClients: { client: SolanaClient; publicClient: SolanaClient };
    /**
     * If provided, will use getOrCreateAssociatedTokenAccount (actually creates ATA on-chain)
     * If not provided, will use getAssociatedTokenAddress (only computes address)
     */
    keyPair?: Keypair;
};

type BuildTransactionResult = {
    transaction: Transaction;
    lastBlockHash: BlockhashWithExpiryBlockHeight;
    isATA?: boolean;
    recipientAddress?: PublicKey;
};

/**
 * Build Solana transaction from order
 * 
 * This is the single source of truth for building Solana transactions.
 * Used for:
 * - Preview and fee calculation (without keyPair)
 * - Transaction simulation (without keyPair)
 * - Actual sending (with keyPair - creates ATAs on-chain)
 * 
 * @param keyPair - Optional. When provided, uses getOrCreateAssociatedTokenAccount.
 *                  When not provided, uses getAssociatedTokenAddress.
 */
export async function buildSolanaTransaction({
    order,
    sender,
    solanaClients,
    keyPair
}: BuildTransactionOptions): Promise<BuildTransactionResult> {
    const { target, comment, amount, token, reference } = order;
    const { client, publicClient } = solanaClients;
    const mintAddress = token ? new PublicKey(token.mint) : null;
    const owner = new PublicKey(sender);
    const recipient = new PublicKey(target);

    const transaction = new Transaction();
    
    // Get latest blockhash with fallback to public client
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

    if (!mintAddress) { 
        // Generic SOL transfer
        const instruction = SystemProgram.transfer({
            fromPubkey: owner,
            toPubkey: recipient,
            lamports: amount
        });

        if (reference) {
            instruction.keys.push(...reference.map(ref => ({ pubkey: ref, isSigner: false, isWritable: true })));
        }

        transaction.add(instruction);
    } else { 
        // Token transfer
        let senderTokenAccount: PublicKey | Account;

        if (keyPair) {
            // Use getOrCreateAssociatedTokenAccount - actually creates ATA on-chain if needed
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
        } else {
            // Use getAssociatedTokenAddress - only computes address
            try {
                senderTokenAccount = await failableSolanaBackoff('getAssociatedTokenAddress', () => getAssociatedTokenAddress(
                    mintAddress,
                    owner
                ));
            } catch (error) {
                const mappedError = mapSolanaError(error);
                if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
                    try {
                        senderTokenAccount = await failableSolanaBackoff('getAssociatedTokenAddress', () => getAssociatedTokenAddress(
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
        }

        // Check if recipient is ATA
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

        // Get recipient address
        if (!isATA) {
            if (keyPair) {
                // Create ATA on-chain if needed
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
                // Just compute address
                try {
                    recipientAddress = await failableSolanaBackoff('getAssociatedTokenAddress', () => getAssociatedTokenAddress(
                        mintAddress,
                        recipient
                    ));
                } catch (error) {
                    const mappedError = mapSolanaError(error);
                    if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
                        try {
                            recipientAddress = await failableSolanaBackoff('getAssociatedTokenAddress', () => getAssociatedTokenAddress(
                                mintAddress,
                                recipient
                            ));
                        } catch (error) {
                            throw mapSolanaError(error);
                        }
                    } else {
                        throw mappedError;
                    }
                }
            }
        } else {
            recipientAddress = recipient;
        }

        // Create transfer instruction
        const senderAddress = 'address' in senderTokenAccount ? senderTokenAccount.address : senderTokenAccount;
        const transferInstruction = createTransferInstruction(
            senderAddress,
            recipientAddress,
            owner,
            amount
        );

        if (reference) {
            transferInstruction.keys.push(...reference.map(ref => ({ pubkey: ref, isSigner: false, isWritable: true })));
        }

        transaction.add(transferInstruction);
    }

    // Add memo/comment if present
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

    return {
        transaction,
        lastBlockHash,
        isATA,
        recipientAddress
    };
}

