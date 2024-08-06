import { atom } from "recoil";
import { storage } from "../../storage/storage";

export enum WalletVersions {
  v4R2 = "v4R2",
  v5R1 = "v5R1",
}

const walletVersiosnKey = 'walletVersions';

function setWalletVersions(newValue: { [key: string]: WalletVersions }) {
    storage.set(walletVersiosnKey, JSON.stringify(newValue));
}

function getWalletVersions(): { [key: string]: WalletVersions } {
    const stored = storage.getString(walletVersiosnKey);
    if (!stored) {
        return {};
    }

    const data = JSON.parse(stored);
    return data;
}

export const walletVersionsAtom = atom({
    key: 'walletVersionAtom',
    default: getWalletVersions(),
    effects: [
        ({ onSet }) => {
            onSet((newValue) => {
                setWalletVersions(newValue);
            });
        }
    ]
});
