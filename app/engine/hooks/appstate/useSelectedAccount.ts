import { useRecoilValue } from 'recoil';
import { selectedAccountSelector } from '../../state/appState';
import { Address } from '@ton/core';

export type SelectedAccount = {
    address: Address;
    addressString: string;
    publicKey: Buffer;
    secretKeyEnc: Buffer;
    utilityKey: Buffer;
}

export function useSelectedAccount() {
    return useRecoilValue(selectedAccountSelector);
}