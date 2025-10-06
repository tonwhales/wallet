import { SolanaClient } from "../../../engine/hooks/solana/useSolanaClient";
import { AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { ThemeType } from "../../../engine/state/theme";
import { BlockhashWithExpiryBlockHeight, Keypair, Transaction } from "@solana/web3.js";
import { PendingSolanaTransaction, PendingTransactionStatus } from "../../../engine/state/pending";
import { parseTransactionInstructions } from "../../../utils/solana/parseInstructions";
import { failableSolanaBackoff } from "./signAndSendSolanaOrder";
import { t } from "../../../i18n/t";
import { SendSolanaTransactionError } from "./mapSolanaError";
import { mapSolanaError } from "./mapSolanaError";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

type SignAndSendSolanaTransactionParams = {
    solanaClients: {
        client: SolanaClient,
        publicClient: SolanaClient
    },
    theme: ThemeType,
    authContext: AuthWalletKeysType,
    transaction: Transaction
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