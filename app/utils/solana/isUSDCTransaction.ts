import { SolanaTransaction } from "../../engine/api/solana/fetchSolanaTransactions";
import { SOLANA_USDC_MINT_DEVNET, SOLANA_USDC_MINT_MAINNET } from "./address";

/**
 * Checks if a Solana transaction is a USDC transaction
 * @param tx - Solana transaction
 * @param isTestnet - testnet flag
 * @returns true if the transaction contains USDC token transfers
 */
export function isUSDCTransaction(tx: SolanaTransaction, isTestnet: boolean): boolean {
    const usdcMint = isTestnet ? SOLANA_USDC_MINT_DEVNET : SOLANA_USDC_MINT_MAINNET;
    
    return tx.tokenTransfers.some(transfer => transfer.mint === usdcMint);
}

