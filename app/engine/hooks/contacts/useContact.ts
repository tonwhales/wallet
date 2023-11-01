import { useAddressBook } from './useAddressBook';

export function useContact(addressString?: string | null) {
    const [full,] = useAddressBook();
    if (!addressString) {
        return null;
    }
    if (full.contacts[addressString]) {
        return full.contacts[addressString];
    }
    return null;
}