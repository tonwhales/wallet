import { useAddressBook } from "./useAddressBook";

export function useDenyList() {
    const [addressBook,] = useAddressBook();
    return addressBook.denyList;
}