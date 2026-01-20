import { SolanaOrder } from "../ops/Order";
import { SolanaClient } from "../../../engine/hooks/solana/useSolanaClient";
import { AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { ThemeType } from "../../../engine/state/theme";
import { Keypair, PublicKey } from "@solana/web3.js";
import { PendingSolanaTransaction, PendingTransactionStatus } from "../../../engine/state/pending";
import { createBackoffFailaible } from "../../../utils/time";
import { t } from "../../../i18n/t";
import { mapSolanaError, SendSolanaTransactionError } from "./mapSolanaError";
import { buildSolanaTransaction } from "./buildSolanaTransaction";

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
    const { client, publicClient } = solanaClients;
    const recipient = new PublicKey(order.target);

    const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
    const keyPair = Keypair.fromSecretKey(new Uint8Array(walletKeys.keyPair.secretKey));

    const { transaction, lastBlockHash, isATA, recipientAddress } = await buildSolanaTransaction({
        order,
        sender,
        solanaClients,
        keyPair // Pass keyPair to create ATAs on-chain
    });

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
                throw await mapSolanaError(error, client);
            }
        });
    } catch (error) {
        const mappedError = await mapSolanaError(error, client);
        if (mappedError instanceof SendSolanaTransactionError && mappedError.isNetworkError) {
            try {
                signature = await failableSolanaBackoff('sendEncodedTransactionPub', () => publicClient.sendEncodedTransaction(transaction.serialize().toString('base64')));
            } catch (error) {
                throw await mapSolanaError(error, publicClient);
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
            comment: order.comment,
            amount: order.amount,
            token: order.token,
            target: order.target,
            sender,
            tokenAccount: isATA ? recipientAddress?.toString() : undefined
        }
    };
}