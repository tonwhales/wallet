import { PublicKey } from "@solana/web3.js";

export function solanaAddressFromPublicKey(buff: Buffer): PublicKey {
    const pubKeyBytes = new Uint8Array(buff);
    return new PublicKey(pubKeyBytes);
}

export const SOLANA_USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SOLANA_USDC_MINT_DEVNET = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

export function isSolanaAddress(addressString: string): boolean {
    if (addressString.length !== 44) {
        return false;
    }

    try {
        new PublicKey(addressString);
        return true;
    } catch {
        return false;
    }
}