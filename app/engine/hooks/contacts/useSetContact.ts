import { useAddressBookContext } from "../../AddressBookContext";

export function useSetContact() {
    const addressBookContext = useAddressBookContext();
    return addressBookContext.setContact;
}