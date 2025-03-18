import { Address } from "@ton/core";
import { useNetwork } from "../network";
import { useRecoilState } from "recoil";
import { AppMode, walletsAppModesAtom } from "../../state/walletsAppModes";

export function useAppMode(address?: string | Address | null): [boolean, (value: boolean) => void] {
    const { isTestnet } = useNetwork();
    const addressString = address instanceof Address
        ? address.toString({ testOnly: isTestnet })
        : address;

    const [state, update] = useRecoilState(walletsAppModesAtom)

    if (!addressString) {
        return [true, () => { }];
    }

    const appMode = state[addressString] || AppMode.Wallet;

    const setAppMode = (value: boolean) => {
        update((state) => ({
            ...state,
            [addressString]: value ? AppMode.Wallet : AppMode.Cards
        }));
    }

    return [appMode === AppMode.Wallet, setAppMode]
}