import { atom } from "recoil";
import { storage } from "../../storage/storage";

const newAddressFormatKey = 'useNewAddressFormat';

function setUseNewAddressFormat(useNewAddressFormat: boolean) {
    storage.set('newAddressFormatKey', useNewAddressFormat);
}

function getUseNewAddressFormat(): boolean {
    const stored = storage.getBoolean(newAddressFormatKey);
    return stored ?? false;
}

export const newAddressFormatAtom = atom({
    key: 'newAddressFormat',
    default: getUseNewAddressFormat(),
    effects: [
        ({ onSet }) => {
            onSet((newValue) => {
                setUseNewAddressFormat(newValue);
            });
        }
    ]
});
