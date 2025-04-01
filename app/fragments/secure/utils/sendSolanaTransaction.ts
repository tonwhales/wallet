import { SolanaOrder } from "../ops/Order";
import { SolanaClient } from "../../../engine/hooks/solana/useSolanaClient";
import { AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { ThemeType } from "../../../engine/state/theme";
import { Keypair, Transaction, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { PendingSolanaTransaction, PendingTransactionStatus } from "../../../engine/state/pending";
import { isPublicKeyATA } from "../../../utils/solana/isPublicKeyATA";

type SendSolanaOrderParams = {
    sender: string,
    solanaClient: SolanaClient,
    theme: ThemeType,
    authContext: AuthWalletKeysType,
    order: SolanaOrder
}

export async function sendSolanaOrder({ solanaClient, theme, authContext, order, sender }: SendSolanaOrderParams): Promise<PendingSolanaTransaction> {
    const { target, comment, amount, token } = order;
    const lastBlockHash = await solanaClient.getLatestBlockhash();
    const mintAddress = token ? new PublicKey(token.mint) : null;
    const owner = new PublicKey(sender);
    const recipient = new PublicKey(target);

    const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
    const keyPair = Keypair.fromSecretKey(new Uint8Array(walletKeys.keyPair.secretKey));

    const transaction = new Transaction();

    if (!mintAddress) {
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: owner,
                toPubkey: recipient,
                lamports: amount
            })
        );
    } else {
        const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
            solanaClient,
            keyPair,
            mintAddress,
            owner
        );

        const isATA = await isPublicKeyATA({
            solanaClient,
            address: recipient,
            mint: mintAddress
        });

        let recipientAddress: PublicKey;

        if (!isATA) {
            recipientAddress = (await getOrCreateAssociatedTokenAccount(
                solanaClient,
                keyPair,
                mintAddress,
                recipient
            )).address;
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
    const signature = await solanaClient.sendEncodedTransaction(transaction.serialize().toString('base64'));

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