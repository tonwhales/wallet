import { SolanaAddress, solanaAddressFromPublicKey } from "../../../utils/solana/core";
import { useSelectedAccount } from "../appstate";

export function useSolanaSelectedAccount(): SolanaAddress | null {
    const acc = useSelectedAccount();

    if (!acc) {
        return null;
    }

    return solanaAddressFromPublicKey(acc.publicKey);
}