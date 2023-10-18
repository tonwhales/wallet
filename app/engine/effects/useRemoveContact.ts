import { useAddressBook } from "../hooks/contacts/useAddressBook";

export function useRemoveContact() {
    const [, update] = useAddressBook();
    return (addressString: string) => {
        return update((doc) => {
            delete doc.contacts[addressString];
        })
    };
}