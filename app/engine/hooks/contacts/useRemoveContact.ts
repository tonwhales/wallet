import { useAddressBookContext } from "../../AddressBookContext";

export function useRemoveContact() {
    const addressBookContext = useAddressBookContext();
    return addressBookContext.removeContact;
}