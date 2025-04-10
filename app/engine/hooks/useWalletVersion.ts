import { Address } from "@ton/core";
import { useAppState, useSelectedAccount } from ".";
import { WalletVersions } from "../types";

export function useWalletVersion(address?: Address | string): WalletVersions {
    const seleted = useSelectedAccount();
    const appState = useAppState();

    const _address = typeof address === 'string' ? Address.parse(address) : address;

    if (_address) {
        const wallet = appState.addresses.find((acc) => acc.address.equals(_address));
        return wallet?.version ?? WalletVersions.v4R2;
    }

    return seleted?.version ?? WalletVersions.v4R2;
}
