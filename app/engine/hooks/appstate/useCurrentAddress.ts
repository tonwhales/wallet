import { useMemo } from "react";
import { getLedgerSelected } from "../../../storage/appState";
import { useSelectedAccount } from "./useSelectedAccount";
import { useSolanaSelectedAccount } from "../solana/useSolanaSelectedAccount";
import { useNetwork } from "../network";
import { Address } from "@ton/core";

export const useCurrentAddress = (): { tonAddress?: Address, tonAddressString?: string, solanaAddress?: string } => {
    const { isTestnet } = useNetwork();
    const standardWalletAddress = useSelectedAccount()?.addressString!;
    const ledgerAddress = useMemo(() => getLedgerSelected(), []);
    const solanaAddress = useSolanaSelectedAccount()!;
    
    try {
        const tonAddress = ledgerAddress
        ? Address.parse(ledgerAddress)
        : Address.parse(standardWalletAddress);
        const tonAddressString = tonAddress.toString({ testOnly: isTestnet });

        return {
            tonAddress,
            tonAddressString,
            solanaAddress: ledgerAddress ? undefined : solanaAddress,
        }
    } catch {
        return {
            tonAddress: undefined,
            tonAddressString: undefined,
            solanaAddress: undefined,
        }
    }

}