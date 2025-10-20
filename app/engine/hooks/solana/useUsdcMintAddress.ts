import { useNetwork } from "../network";
import { SOLANA_USDC_MINT_DEVNET, SOLANA_USDC_MINT_MAINNET } from "../../../utils/solana/address";

export const useUsdcMintAddress = () => {
    const { isTestnet } = useNetwork();
    return isTestnet ? SOLANA_USDC_MINT_DEVNET : SOLANA_USDC_MINT_MAINNET;
}