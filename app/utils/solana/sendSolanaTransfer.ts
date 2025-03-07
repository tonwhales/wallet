import { appendTransactionMessageInstructions, compileTransaction, createKeyPairFromBytes, createSignerFromKeyPair, createTransactionMessage, getBase64EncodedWireTransaction, getComputeUnitEstimateForTransactionMessageFactory, pipe, prependTransactionMessageInstruction, Rpc, setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash, Signature, signTransaction } from "@solana/kit";
import { SolanaOrder } from "../../fragments/secure/ops/Order";
import { SolanaClient } from "../../engine/hooks/solana/useSolanaClient";
import { AuthWalletKeysType } from "../../components/secure/AuthWalletKeys";
import { ThemeType } from "../../engine/state/theme";
import { getTransferSolInstruction } from "@solana-program/system";
import { SolanaAddress } from "./core";
import { getAddMemoInstruction } from "@solana-program/memo";
import { getSetComputeUnitLimitInstruction } from "@solana-program/compute-budget";


type SendSolanaTransferParams = {
    sender: SolanaAddress,
    solanaClient: SolanaClient,
    theme: ThemeType,
    authContext: AuthWalletKeysType,
    order: SolanaOrder
}

export async function sendSolanaTransfer({ solanaClient, theme, authContext, order, sender }: SendSolanaTransferParams): Promise<Signature> {
    const lastBlockHash = await solanaClient.getLatestBlockhash().send();
    const { target, comment, amount } = order;

    const recentBlockhash = {
        blockhash: lastBlockHash.value.blockhash,
        lastValidBlockHeight: lastBlockHash.value.lastValidBlockHeight,
    };

    const getComputeUnitEstimateForTransactionMessage = getComputeUnitEstimateForTransactionMessageFactory({ rpc: solanaClient });

    const walletKeys = await authContext.authenticate({ backgroundColor: theme.surfaceOnBg });
    const privateKey = new Uint8Array(walletKeys.keyPair.secretKey);
    const keyPair = await createKeyPairFromBytes(privateKey);
    const signer = await createSignerFromKeyPair(keyPair);

    const instructions: any[] = [
        getTransferSolInstruction({
            source: signer,
            destination: target,
            amount,
        })
    ];

    if (comment) {
        instructions.push(getAddMemoInstruction({ memo: comment }));
    }

    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        tx => setTransactionMessageFeePayer(sender, tx),
        tx => appendTransactionMessageInstructions(instructions, tx),
        tx => setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, tx),
    );

    const computeUnitEstimate = await getComputeUnitEstimateForTransactionMessage(transactionMessage);

    const transactionMessageWithComputeUnitLimit = prependTransactionMessageInstruction(
        getSetComputeUnitLimitInstruction({ units: computeUnitEstimate }),
        transactionMessage,
    );

    // Send
    const transaction = compileTransaction(transactionMessageWithComputeUnitLimit);
    const signedTransaction = await signTransaction([keyPair], transaction);
    const base64Transaction = getBase64EncodedWireTransaction(signedTransaction);
    const sent = await solanaClient.sendTransaction(base64Transaction, { encoding: 'base64' }).send();

    return sent;
}