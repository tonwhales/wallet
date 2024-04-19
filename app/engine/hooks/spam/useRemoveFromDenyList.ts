import { useAddressBookContext } from "../../AddressBookContext";

export function useRemoveFromDenyList() {
    const addressBookContext = useAddressBookContext();
    return addressBookContext.removeFromDenyList;
}