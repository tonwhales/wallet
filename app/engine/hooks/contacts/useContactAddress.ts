import { Address } from '@ton/core';
import { AddressContact, useAddressBook } from './useAddressBook';
import { useNetwork } from '../useNetwork';

export function useContactAddress(address?: Address): AddressContact | null {
    const { isTestnet } = useNetwork();
    const [full,] = useAddressBook();
    if (!address) {
        return null;
    }
    const addressString = address.toString({ testOnly: isTestnet });
    if (full.contacts[addressString]) {
        return full.contacts[addressString];
    }
    return null;
}