import { atom } from "recoil";
import { sharedStoragePersistence } from "../../storage/storage";

const lockAppWithAuthStateKey = 'lockAppWithAuthState';

export function getLockAppWithAuthState() {
    return sharedStoragePersistence.getBoolean(lockAppWithAuthStateKey) || false;
}

function storeLockAppWithAuthState(value: boolean) {
    sharedStoragePersistence.set(lockAppWithAuthStateKey, value);
}

export const lockAppWithAuthState = atom<boolean>({
    key: 'auth/lockAppWithAuthState',
    default: getLockAppWithAuthState(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeLockAppWithAuthState(newValue);
        })
    }]
});