import { SolanaClient } from "../../../engine/hooks/solana/useSolanaClient";
import { AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { ThemeType } from "../../../engine/state/theme";
import { BlockhashWithExpiryBlockHeight, Keypair, Transaction } from "@solana/web3.js";
import { PendingSolanaTransaction, PendingTransactionStatus } from "../../../engine/state/pending";
import { parseTransactionInstructions } from "../../../utils/solana/parseInstructions";
import { failableSolanaBackoff, mapSolanaError } from "./signAndSendSolanaOrder";

type SignAndSendSolanaTransactionParams = {
    solanaClients: {
        client: SolanaClient,
        publicClient: SolanaClient
    },
    theme: ThemeType,
    authContext: AuthWalletKeysType,
    transaction: Transaction
}

export async function signAndSendSolanaTransaction({ solanaClients, theme, authContext, transaction }: SignAndSendSolanaTransactionParams): Promise<PendingSolanaTransaction> {
    const { client, publicClient } = solanaClients;

    const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
    const keyPair = Keypair.fromSecretKey(new Uint8Array(walletKeys.keyPair.secretKey));

    let lastBlockHash: BlockhashWithExpiryBlockHeight;
    try {
        lastBlockHash = await failableSolanaBackoff('getLatestBlockhash', () => client.getLatestBlockhash());
    } catch (error) {
        throw mapSolanaError(error);
    }

    transaction.recentBlockhash = lastBlockHash.blockhash;

    // 
    // Sign and send
    //
    transaction.sign(keyPair);

    let signature: string;
    try {
        signature = await failableSolanaBackoff('sendEncodedTransaction', () => client.sendEncodedTransaction(transaction.serialize().toString('base64')));
    } catch (error) {
        throw mapSolanaError(error);
    }

    return {
        type: 'instructions',
        id: signature,
        time: Math.floor(Date.now() / 1000),
        status: PendingTransactionStatus.Pending,
        lastBlockHash,
        instructions: parseTransactionInstructions(transaction.instructions)
    };
}