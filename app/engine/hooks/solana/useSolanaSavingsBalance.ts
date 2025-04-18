import { fromNano, toNano } from "@ton/core";
import { useNetwork, usePrice, useSolanaAccount, useSolanaTokens } from "..";
import { SOLANA_USDC_MINT_DEVNET, SOLANA_USDC_MINT_MAINNET } from "../../../utils/solana/address";

export function useSolanaSavingsBalance(address: string) {
    const { isTestnet } = useNetwork();
    const { data } = useSolanaTokens(address);
    const [tonRates, , solanaRates] = usePrice();
    const tokens = data ?? [];
    const account = useSolanaAccount(address);
    const solBalance = account.data?.balance ?? 0n;
    const usdcMint = isTestnet ? SOLANA_USDC_MINT_DEVNET : SOLANA_USDC_MINT_MAINNET;
    const stable = tokens.find(t => t.address === usdcMint);

    let stableTokenBalance = 0n;
    if (stable?.uiAmount) {
        try {
            stableTokenBalance = toNano(stable?.uiAmount ?? 0)
        } catch { }
    }
    let solBalanceUsd = 0n;
    try {
        solBalanceUsd = toNano(parseFloat(fromNano(solBalance)) * (solanaRates?.price?.usd ?? 0))
    } catch { }

    const totalSolanaBalance = stableTokenBalance + solBalanceUsd;

    let solToTon = 0n;

    if (totalSolanaBalance && tonRates?.price?.usd) {
        try {
            solToTon = toNano(parseFloat(fromNano(totalSolanaBalance)) / (tonRates.price.usd))
        } catch { }
    }

    return { solAssets: totalSolanaBalance, solAssetsToTon: solToTon };
}