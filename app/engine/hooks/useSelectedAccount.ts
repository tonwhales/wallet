import { useRecoilValue } from 'recoil';
import { appStateSelector } from '../state/appState';

export function useSelectedAccount() {
    let state = useRecoilValue(appStateSelector);

    console.log('selected-account', state.addresses.map(a => a.addressString));

    return state.addresses[state.selected];
}