import { Address } from '@ton/core';
import { useAddressBook } from './useAddressBook';
import { useNetwork } from '../useNetwork';

export function useDenyAddress(address?: Address): boolean {
    const { isTestnet } = useNetwork();
    const [full,] = useAddressBook();
    if (!address) {
        return false;
    }
    const addressString = address.toString({ testOnly: isTestnet });
    if (full.denyList[addressString]) {
        return !!full.denyList[addressString];
    }
    return false;
}