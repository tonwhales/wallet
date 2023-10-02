import { useRecoilValue } from 'recoil';
import { appStateAtom } from '../state/appState';
import { Address } from '@ton/core';

export type SelectedAccount = {
    address: Address;
    addressString: string;
    publicKey: Buffer;
    secretKeyEnc: Buffer;
    utilityKey: Buffer;
}

export function useSelectedAccount() {
    let state = useRecoilValue(appStateAtom);

    return (state.selected === -1 || state.selected >= state.addresses.length)
        ? null
        : state.addresses[state.selected];
}