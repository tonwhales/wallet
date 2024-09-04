import { useSelectedAccount } from ".";
import { WalletVersions } from "../types";

export function useWalletVersion(): WalletVersions {
    const seleted = useSelectedAccount();
    return seleted?.version ?? WalletVersions.v4R2;
}
