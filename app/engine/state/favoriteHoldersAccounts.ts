import { atom } from "recoil";
import { sharedStoragePersistence } from "../../storage/storage";

const favoriteHoldersAccountsKey = 'favoriteHoldersAccounts';

export function setFavoriteHoldersAccounts(favoriteHoldersAccounts: { [key: string]: string }) {
    sharedStoragePersistence.set(favoriteHoldersAccountsKey, JSON.stringify(favoriteHoldersAccounts));
}

function getFavoriteHoldersAccounts(): Record<string, string> {
    let favoriteHoldersAccounts = sharedStoragePersistence.getString(favoriteHoldersAccountsKey);
    return favoriteHoldersAccounts ? JSON.parse(favoriteHoldersAccounts) : {};
}

export const favoriteHoldersAccountsAtom = atom({
    key: 'wallet/favoriteHoldersAccounts',
    default: getFavoriteHoldersAccounts(),
    effects: [
        ({ onSet }) => {
            onSet((favoriteHoldersAccounts) => {
                setFavoriteHoldersAccounts(favoriteHoldersAccounts);
            });
        }
    ]
});