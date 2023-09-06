import { useRecoilValue } from 'recoil';
import { selectedAccountSelector } from '../state/appState';

export function useSelectedAccount() {
    return useRecoilValue(selectedAccountSelector);
}