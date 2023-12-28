import { WalletSettings, walletsSettingsAtom } from "../../state/walletSettings";
import { useRecoilState } from "recoil";

export function useWalletsSettings(): [
    { [key: string]: WalletSettings },
    (updater: (settings: { [key: string]: WalletSettings}) => { [key: string]: WalletSettings }) => void
] {
    return useRecoilState(walletsSettingsAtom);
}