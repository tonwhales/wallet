import { storage } from "../../storage/storage";

export const isDogsRefKey = 'dogsRef';

export function setDogsRef(isDogs: boolean) {
    storage.set(isDogsRefKey, isDogs);
}

export function getDogsRef() {
    return storage.getBoolean(isDogsRefKey) ?? false;
}