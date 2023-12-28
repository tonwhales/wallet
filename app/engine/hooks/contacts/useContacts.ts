import { useAddressBook } from "./useAddressBook";

export function useContacts() {
    const [addressBook,] = useAddressBook();
    return addressBook.contacts;
}