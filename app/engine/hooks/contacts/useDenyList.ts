import { useAddressBookContext } from "../../AddressBookContext";

export function useDenyList() {
    const addressBookContext = useAddressBookContext();
    return addressBookContext.state.denyList;
}