import { toNano } from "@ton/core";
import { SolanaSimpleTransferParams } from "../../fragments/solana/simpleTransfer/SolanaSimpleTransferFragment";
import { SolanaTransactionPreview } from "../../engine/hooks/solana/useSolanaTransferInfo";

export function solanaPreviewToTransferParams(preview: SolanaTransactionPreview): SolanaSimpleTransferParams | null {
    if (preview.kind === 'in') {
        return null;
    }

    const amount = toNano(preview.amount);

    return {
        target: preview.address,
        comment: preview.comment,
        amount: amount.toString(),
        token: preview.mint,
    }
}