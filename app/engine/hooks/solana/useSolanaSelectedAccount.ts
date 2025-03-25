import { solanaAddressFromPublicKey } from "../../../utils/solana/address";
import { useSelectedAccount } from "../appstate";

export function useSolanaSelectedAccount(): string | null {
    const acc = useSelectedAccount();

    if (!acc) {
        return null;
    }

    return solanaAddressFromPublicKey(acc.publicKey).toString();
}