import { Address } from '@ton/core';
import { AddressContact, useAddressBook } from './useAddressBook';
import { useNetwork } from '../useNetwork';

export function useContactAddress(addressString?: string): AddressContact | null {
    const [full,] = useAddressBook();
    if (!addressString) {
        return null;
    }
    if (full.contacts[addressString]) {
        return full.contacts[addressString];
    }
    return null;
}