import { useAddressBookContext } from "../../AddressBookContext";

export function useContacts() {
    const addressBookContext = useAddressBookContext();
    return addressBookContext.state.contacts;
}