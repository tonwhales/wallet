import { Address } from "@ton/core";
import { useNetwork } from "../network";
import { WalletSettings, walletsSettingsAtom } from "../../state/walletSettings";
import { useRecoilState } from "recoil";
import { useWalletsSettings } from ".";

export function useWalletSettings(address?: string | Address | null): [WalletSettings, (settings: WalletSettings) => void] {
    const { isTestnet } = useNetwork();
    const addressString = address instanceof Address
        ? address.toString({ testOnly: isTestnet })
        : address;

    const [state, update] = useWalletsSettings();

    if (!addressString) {
        return [{} as WalletSettings, () => { }];
    }

    const settings = state[addressString] || {};

    const setSettings = (settings: WalletSettings) => {
        update((state) => ({
            ...state,
            [addressString]: settings
        }));
    }

    return [settings, setSettings]
}