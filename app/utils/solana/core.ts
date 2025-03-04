import { Address as SolanaAddress, address, isAddress, getAddressDecoder, Transaction as SolanaTransaction } from '@solana/kit';

export { SolanaAddress, SolanaTransaction };

export function solanaAddressFromString(addressString: string): SolanaAddress {
    return address(addressString) as SolanaAddress;
}

export function solanaAddressFromPublicKey(pubKey: Buffer): SolanaAddress {
    const pubKeyBytes = new Uint8Array(pubKey);
    const decoder = getAddressDecoder();
    const address = decoder.decode(pubKeyBytes);
    return address as SolanaAddress;
}

export function isSolanaAddress(addressString: string): boolean {
    try {
        if (!isAddress(addressString)) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}