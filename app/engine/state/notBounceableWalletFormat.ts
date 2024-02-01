import { atom } from "recoil";
import { storage } from "../../storage/storage";

const newAddressFormatKey = 'notBounceableWalletsKey';

function setNotBounceableWalletsFormat(useNewAddressFormat: boolean) {
    storage.set(newAddressFormatKey, useNewAddressFormat);
}

function getNotBounceableWalletsFormatFormat(): boolean {
    const stored = storage.getBoolean(newAddressFormatKey);
    return stored ?? false;
}

export const notBounceableWalletFormatAtom = atom({
    key: 'notBounceableWallets',
    default: getNotBounceableWalletsFormatFormat(),
    effects: [
        ({ onSet }) => {
            onSet((newValue) => {
                setNotBounceableWalletsFormat(newValue);
            });
        }
    ]
});
