import { useRecoilState } from 'recoil';
import { ledgerEnabledState } from '../../state/ledger';

export function useLedgerEnabled(): [boolean, (enabled: boolean) => void] {
    return useRecoilState(ledgerEnabledState);
}