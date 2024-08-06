import { Address } from "@ton/core";
import { useRecoilState } from "recoil";
import { useNetwork, useSelectedAccount } from ".";
import { WalletVersions, walletVersionsAtom } from "../state/walletVersions";

export function useWalletsVersion() {
    return useRecoilState(walletVersionsAtom);
}

export function useWalletVersion(): WalletVersions {
    const { isTestnet } = useNetwork();
    const seleted = useSelectedAccount();
    const addressString = seleted?.address.toString({ testOnly: isTestnet });

    const [state] = useRecoilState(walletVersionsAtom);

    if (!addressString) {
        return WalletVersions.v4R2;
    }

    const version = state[addressString] || WalletVersions.v4R2;
    return version
}

export function useSetW5Version() {
    const { isTestnet } = useNetwork();
    const [, update] = useRecoilState(walletVersionsAtom);

    const setW5Version = (address?: string | Address | null) => {
        const addressString = address instanceof Address
            ? address.toString({ testOnly: isTestnet })
            : address;

        console.log('setW5Version', addressString);
        if (addressString) {
            update((state) => ({
                ...state,
                [addressString]: WalletVersions.v5R1
            }));
        }
    };

    return setW5Version;
}