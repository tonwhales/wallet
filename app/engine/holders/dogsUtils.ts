import { storage } from "../../storage/storage";

export const isDogsRefKey = 'dogsRef';
export const isDogsInvShownKey = 'isDogsInvShown';

export function getDogsInvShown() {
    return storage.getBoolean(isDogsInvShownKey) ?? false;
}

export function setDogsInvShown(isDogsInvShown: boolean) {
    storage.set(isDogsInvShownKey, isDogsInvShown);
}

export function setDogsRef(isDogs: boolean) {
    storage.set(isDogsRefKey, isDogs);
}

export function getDogsRef() {
    return storage.getBoolean(isDogsRefKey) ?? false;
}