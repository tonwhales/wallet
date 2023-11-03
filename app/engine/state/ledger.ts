import { atom } from 'recoil';
import { getLedgerEnabled, setLedgerEnabled } from '../../storage/appState';

export const ledgerEnabledState = atom({
    key: 'misc/ledgerEnabledState',
    default: (getLedgerEnabled() || false),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            setLedgerEnabled(newValue);
        })
    }]
});