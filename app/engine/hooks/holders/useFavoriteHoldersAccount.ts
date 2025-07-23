import { useRecoilState } from "recoil";
import { favoriteHoldersAccountsAtom } from "../../state/favoriteHoldersAccounts";
import { useCurrentAddress } from "../appstate/useCurrentAddress";
import { useHoldersAccounts } from "./useHoldersAccounts";

/**
 * Returns the favorite holders account for the current address.
 * If the favorite holders account is not set, it returns the first account from the holders accounts.
 * If there are no holders accounts and no favorite holders account is set, it returns undefined.
 * @returns [string | undefined, (value: string) => void]
 */
export function useFavoriteHoldersAccount(): [string | undefined, (value: string) => void] {
    const { tonAddressString, solanaAddress } = useCurrentAddress();

    const { accounts } = useHoldersAccounts(tonAddressString, solanaAddress).data ?? {};

    const [state, update] = useRecoilState(favoriteHoldersAccountsAtom)
    try {
        if (!tonAddressString) {
            throw new Error();
        }

        const favoriteHoldersAccount = state[tonAddressString] || accounts?.[accounts.length - 1]?.address;

        const setFavoriteHoldersAccount = (value: string) => {
            update((state) => ({
                ...state,
                [tonAddressString]: value
            }));
        }

        if (!favoriteHoldersAccount) {
            throw new Error();
        }

        return [favoriteHoldersAccount, setFavoriteHoldersAccount]
    } catch {
        return [undefined, () => { }];
    }
}