import { SolanaTransaction } from "../../engine/api/solana/fetchSolanaTransactions";
import { SOLANA_USDC_MINT_DEVNET, SOLANA_USDC_MINT_MAINNET } from "./address";

/**
 * Checks if a Solana transaction is a USDC transaction
 * @param tx - Solana transaction
 * @returns true if the transaction contains USDC token transfers
 */
export function isUSDCTransaction(tx: SolanaTransaction): boolean {
    return tx.tokenTransfers.some(transfer => transfer.mint === SOLANA_USDC_MINT_DEVNET || transfer.mint === SOLANA_USDC_MINT_MAINNET);
}

