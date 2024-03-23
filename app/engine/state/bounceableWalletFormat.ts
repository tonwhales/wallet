import { atom } from "recoil";
import { storage } from "../../storage/storage";

const bounceableWalletFormatKey = 'bounceableWalletFormat';

function setBounceableWalletFormat(newValue: boolean) {
    storage.set(bounceableWalletFormatKey, newValue);
}

function getBounceableWalletFormat(): boolean {
    const stored = storage.getBoolean(bounceableWalletFormatKey);
    return stored ?? true; // default value is true, for new wallets it will be set to false
}

export const bounceableWalletFormatAtom = atom({
    key: 'bounceableWalletFormatAtom',
    default: getBounceableWalletFormat(),
    effects: [
        ({ onSet }) => {
            onSet((newValue) => {
                setBounceableWalletFormat(newValue);
            });
        }
    ]
});
