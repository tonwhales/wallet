import { atom } from "recoil";
import { sharedStoragePersistence } from "../../storage/storage";

const screenProtectorStateKey = 'screenProtectorState';

export function getScreenProtectorState() {
    const value = sharedStoragePersistence.getBoolean(screenProtectorStateKey)
    
    return value === undefined ? true : value;
}

function storeScreenProtectorState(value: boolean) {
    sharedStoragePersistence.set(screenProtectorStateKey, value);
}

export const screenProtectorState = atom<boolean>({
    key: 'screenProtector',
    default: getScreenProtectorState(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeScreenProtectorState(newValue);
        })
    }]
});