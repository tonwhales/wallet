import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import {
    type BlockhashWithExpiryBlockHeight,
    Keypair,
    SendTransactionError,
    type Transaction,
    type VersionedTransaction
} from '@solana/web3.js';
import nacl from 'tweetnacl';
import { AuthWalletKeysType } from '../../../components/secure/AuthWalletKeys';
import { SolanaClient } from '../../../engine/hooks/solana/useSolanaClient';
import { PendingSolanaTransaction, PendingTransactionStatus } from '../../../engine/state/pending';
import { ThemeType } from '../../../engine/state/theme';
import { t } from '../../../i18n/t';
import { saveErrorLog } from '../../../storage';
import { parseTransactionInstructions } from '../../../utils/solana/parseInstructions';
import { SendSolanaTransactionError } from './mapSolanaError';
import { mapSolanaError } from './mapSolanaError';
import { failableSolanaBackoff } from './signAndSendSolanaOrder';

async function logSolanaError(error: unknown, client: SolanaClient, context: string) {
    let logs: string[] | undefined;
    if (error instanceof SendTransactionError) {
        try {
            logs = await error.getLogs(client);
        } catch {
            // ignore getLogs errors
        }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    saveErrorLog({
        message: errorMessage,
        stack: errorStack,
        url: 'signAndSendSolanaVersionedTransaction',
        additionalData: {
            context,
            logs
        }
    });
}

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
        const mappedError = await mapSolanaError(error, client);
        if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
            try {
                lastBlockHash = await failableSolanaBackoff('getLatestBlockhash', () => publicClient.getLatestBlockhash());
            } catch (error) {
                throw await mapSolanaError(error, publicClient);
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
        const mappedError = await mapSolanaError(error, client);
        if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
            try {
                signature = await failableSolanaBackoff('sendEncodedTransaction', () => publicClient.sendEncodedTransaction(transaction.serialize().toString('base64')));
            } catch (error) {
                throw await mapSolanaError(error, publicClient);
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
            await logSolanaError(error, client, 'getLatestBlockhash:primary');
            const mappedError = await mapSolanaError(error, client);
            if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
                try {
                    lastBlockHash = await failableSolanaBackoff('getLatestBlockhash', () => publicClient.getLatestBlockhash());
                } catch (error) {
                    await logSolanaError(error, publicClient, 'getLatestBlockhash:fallback');
                    throw await mapSolanaError(error, publicClient);
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
    } catch (error) {
        await logSolanaError(error, client, 'sign');
        throw new SendSolanaTransactionError(t('transfer.solana.error.signingFailed'));
    }

    const serializedTx = transaction.serialize();

    let signature: string;
    const encodedTx = Buffer.from(serializedTx as Uint8Array).toString('base64');

    try {
        signature = await failableSolanaBackoff('sendEncodedTransaction', () => client.sendEncodedTransaction(encodedTx));
    } catch (error) {
        await logSolanaError(error, client, 'sendEncodedTransaction:primary');
        const mappedError = await mapSolanaError(error, client);
        if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
            try {
                signature = await failableSolanaBackoff('sendEncodedTransaction', () => publicClient.sendEncodedTransaction(encodedTx));
            } catch (error) {
                await logSolanaError(error, publicClient, 'sendEncodedTransaction:fallback');
                throw await mapSolanaError(error, publicClient);
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
