import { useRecoilValue } from 'recoil';
import { selectedAccountSelector } from '../../state/appState';
import { SelectedAccount } from '../../types';

export function useSelectedAccount(): SelectedAccount | null {
    return useRecoilValue(selectedAccountSelector);
}