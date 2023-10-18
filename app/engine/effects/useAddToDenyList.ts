import { useAddressBook } from "../hooks/contacts/useAddressBook";

export function useAddToDenyList() {
    const [, update] = useAddressBook();
    return (addressString: string, reason: string = 'spam') => {
        return update((doc) => doc.denyList[addressString] = { reason })
    };
}