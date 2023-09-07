import { useRecoilValue } from 'recoil';
import { appStateSelector } from '../state/appState';

export function useSelectedAccount() {
    let state = useRecoilValue(appStateSelector);

    return state.addresses[state.selected];
}