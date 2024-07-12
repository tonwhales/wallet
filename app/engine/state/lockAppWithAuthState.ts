import { atom } from "recoil";
import { sharedStoragePersistence, storage } from "../../storage/storage";

const lockAppWithAuthStateKey = 'lockAppWithAuthState';
const lockAppWithAuthMandatoryKey = 'lockAppWithAuthMandatory';

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

export function getLockAppWithAuthMandatory() {
    return storage.getBoolean(lockAppWithAuthMandatoryKey) || false;
}

function storeLockAppWithAuthMandatory(value: boolean) {
    storage.set(lockAppWithAuthMandatoryKey, value);
}

export const lockAppWithAuthMandatoryState = atom<boolean>({
    key: 'auth/lockAppWithAuthState/mandatory',
    default: getLockAppWithAuthMandatory(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeLockAppWithAuthMandatory(newValue);
        })
    }]
});