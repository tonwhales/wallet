import { Address } from "@ton/core";
import { useAppState, useSelectedAccount } from ".";
import { WalletVersions } from "../types";

export function useWalletVersion(address?: Address): WalletVersions {
    const seleted = useSelectedAccount();
    const appState = useAppState();

    if (address) {
        const wallet = appState.addresses.find((acc) => acc.address.equals(address));
        return wallet?.version ?? WalletVersions.v4R2;
    }

    return seleted?.version ?? WalletVersions.v4R2;
}
