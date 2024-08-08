import { Address } from "@ton/core";
import { useRecoilState } from "recoil";
import { useSelectedAccount } from ".";
import { WalletVersions, walletVersionsAtom } from "../state/walletVersions";

export function useWalletsVersion() {
    return useRecoilState(walletVersionsAtom);
}

export function useWalletVersion(): WalletVersions {
    const seleted = useSelectedAccount();
    const addressString = seleted?.address.toRawString();

    const [state] = useRecoilState(walletVersionsAtom);

    if (!addressString) {
        return WalletVersions.v4R2;
    }

    const version = state[addressString] || WalletVersions.v4R2;
    return version
}

export function useSetW5Version() {
    const [, update] = useRecoilState(walletVersionsAtom);

    const setW5Version = (address: Address) => {
        const addressString = address.toRawString();
        update((state) => ({
            ...state,
            [addressString]: WalletVersions.v5R1
        }));
    };

    return setW5Version;
}