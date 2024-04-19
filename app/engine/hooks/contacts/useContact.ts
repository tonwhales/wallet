import { useAddressBookContext } from '../../AddressBookContext';

export function useContact(addressString?: string | null) {
    const addressBookContext = useAddressBookContext();
    return addressBookContext.asContact(addressString);
}