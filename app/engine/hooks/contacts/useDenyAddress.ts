import { Address } from '@ton/core';
import { useAddressBook } from './useAddressBook';
import { useNetwork } from '../network/useNetwork';

export function useDenyAddress(addressString?: string): boolean {
    const [full,] = useAddressBook();
    if (!addressString) {
        return false;
    }

    if (full.denyList[addressString]) {
        return !!full.denyList[addressString];
    }
    return false;
}