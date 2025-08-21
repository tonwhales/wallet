import { useMemo } from "react";
import { getLedgerSelected } from "../../../storage/appState";
import { useSelectedAccount } from "./useSelectedAccount";
import { useSolanaSelectedAccount } from "../solana/useSolanaSelectedAccount";
import { useNetwork } from "../network";
import { Address } from "@ton/core";

export const useCurrentAddress = (): { tonAddress: Address, tonAddressString: string, solanaAddress?: string, isLedger: boolean } => {
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const standardWalletAddressString = selected?.addressString!;
    const ledgerAddressString = useMemo(() => getLedgerSelected(), []);
    const solanaAddress = useSolanaSelectedAccount()!;

    try {
        const tonAddress = ledgerAddressString
            ? Address.parse(ledgerAddressString)
            : Address.parse(standardWalletAddressString);
        const tonAddressString = tonAddress.toString({ testOnly: isTestnet });

        return {
            tonAddress,
            tonAddressString,
            solanaAddress: ledgerAddressString ? undefined : solanaAddress,
            isLedger: !!ledgerAddressString
        }
    } catch {
        return {
            tonAddress: selected?.address!,
            tonAddressString: selected?.addressString!,
            solanaAddress: undefined,
            isLedger: !!ledgerAddressString
        }
    }

}