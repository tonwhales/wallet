import { useAddressBookContext } from '../../AddressBookContext';

export function useDenyAddress(addressString?: string): boolean {
    const addressBookContext = useAddressBookContext();
    return addressBookContext.isDenyAddress(addressString);
}