import { SolanaClient } from "../../../engine/hooks/solana/useSolanaClient";
import { AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { ThemeType } from "../../../engine/state/theme";
import { BlockhashWithExpiryBlockHeight, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import { PendingSolanaTransaction, PendingTransactionStatus } from "../../../engine/state/pending";
import { parseTransactionInstructions } from "../../../utils/solana/parseInstructions";
import { failableSolanaBackoff } from "./signAndSendSolanaOrder";
import { t } from "../../../i18n/t";
import { SendSolanaTransactionError } from "./mapSolanaError";
import { mapSolanaError } from "./mapSolanaError";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import nacl from 'tweetnacl';

type SignAndSendSolanaTransactionParams = {
    solanaClients: {
        client: SolanaClient,
        publicClient: SolanaClient
    },
    theme: ThemeType,
    authContext: AuthWalletKeysType,
    transaction: Transaction
}

type SignAndSendSolanaVersionedTransactionParams = {
    solanaClients: {
        client: SolanaClient,
        publicClient: SolanaClient
    },
    theme: ThemeType,
    authContext: AuthWalletKeysType,
    transaction: VersionedTransaction
}

function getInstructionsFromVersionedTransaction(transaction: VersionedTransaction): ReturnType<typeof parseTransactionInstructions> {
    const message = transaction.message;
    const instructions = message.compiledInstructions.map((ix) => {
        const programId = message.staticAccountKeys[ix.programIdIndex];
        const keys = ix.accountKeyIndexes.map((idx) => ({
            pubkey: message.staticAccountKeys[idx],
            isSigner: message.isAccountSigner(idx),
            isWritable: message.isAccountWritable(idx)
        }));
        return {
            programId,
            keys,
            data: Buffer.from(ix.data)
        };
    });
    return parseTransactionInstructions(instructions);
}

export async function signAndSendSolanaTransaction({ solanaClients, theme, authContext, transaction }: SignAndSendSolanaTransactionParams): Promise<PendingSolanaTransaction & { base58Signature: string }> {
    const { client, publicClient } = solanaClients;

    const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
    const keyPair = Keypair.fromSecretKey(new Uint8Array(walletKeys.keyPair.secretKey));

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

    transaction.recentBlockhash = lastBlockHash.blockhash;

    // 
    // Sign and send
    //
    try {
        transaction.sign(keyPair);
    } catch {
        throw new SendSolanaTransactionError(t('transfer.solana.error.signingFailed'));
    }

    let signature: string;
    try {
        signature = await failableSolanaBackoff('sendEncodedTransaction', () => client.sendEncodedTransaction(transaction.serialize().toString('base64')));
    } catch (error) {
        const mappedError = mapSolanaError(error);
        if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
            try {
                signature = await failableSolanaBackoff('sendEncodedTransaction', () => publicClient.sendEncodedTransaction(transaction.serialize().toString('base64')));
            } catch (error) {
                throw mapSolanaError(error);
            }
        } else {
            throw mappedError;
        }
    }

    const base58Signature = signature;
    const base64Signature = bs58.decode(base58Signature).toString('base64');

    return {
        type: 'instructions',
        id: base64Signature,
        base58Signature,
        time: Math.floor(Date.now() / 1000),
        status: PendingTransactionStatus.Pending,
        lastBlockHash,
        instructions: parseTransactionInstructions(transaction.instructions)
    };
}

export async function signAndSendSolanaVersionedTransaction({
    solanaClients,
    theme,
    authContext,
    transaction
}: SignAndSendSolanaVersionedTransactionParams): Promise<PendingSolanaTransaction & { base58Signature: string }> {
    const { client, publicClient } = solanaClients;

    const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
    const keyPair = Keypair.fromSecretKey(new Uint8Array(walletKeys.keyPair.secretKey));

    const numRequiredSignatures = transaction.message.header.numRequiredSignatures;

    let lastBlockHash: BlockhashWithExpiryBlockHeight;
    if (numRequiredSignatures <= 1) {
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
        transaction.message.recentBlockhash = lastBlockHash.blockhash;
    } else {
        // For multi-sig transactions, use the existing blockhash from the transaction
        lastBlockHash = {
            blockhash: transaction.message.recentBlockhash,
            lastValidBlockHeight: 0 // Not available for pre-signed transactions
        };
    }

    try {
        const messageBytes = new Uint8Array(transaction.message.serialize());
        const signature = nacl.sign.detached(messageBytes, new Uint8Array(keyPair.secretKey));
        transaction.addSignature(keyPair.publicKey, signature);
    } catch {
        throw new SendSolanaTransactionError(t('transfer.solana.error.signingFailed'));
    }

    const serializedTx = transaction.serialize();

    let signature: string;
    const encodedTx = Buffer.from(serializedTx as Uint8Array).toString('base64');

    try {
        signature = await failableSolanaBackoff('sendEncodedTransaction', () => client.sendEncodedTransaction(encodedTx));
    } catch (error) {
        const mappedError = mapSolanaError(error);
        if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
            try {
                signature = await failableSolanaBackoff('sendEncodedTransaction', () => publicClient.sendEncodedTransaction(encodedTx));
            } catch (error) {
                throw mapSolanaError(error);
            }
        } else {
            throw mappedError;
        }
    }

    const base58Signature = signature;
    const base64Signature = bs58.decode(base58Signature).toString('base64');

    return {
        type: 'instructions',
        id: base64Signature,
        base58Signature,
        time: Math.floor(Date.now() / 1000),
        status: PendingTransactionStatus.Pending,
        lastBlockHash,
        instructions: getInstructionsFromVersionedTransaction(transaction)
    };
}
