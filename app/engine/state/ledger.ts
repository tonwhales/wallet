import { atom } from 'recoil';
import {getLedgerEnabled, getLedgerWallets, setLedgerEnabled} from '../../storage/appState';
import { storage } from '../../storage/storage';
import { LedgerWallet } from '../../fragments/ledger/components/TransportContext';

export const ledgerWalletsKey = 'ledgerWalletsKey';

export const ledgerEnabledState = atom({
    key: 'misc/ledgerEnabledState',
    default: (getLedgerEnabled() || false),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            setLedgerEnabled(newValue);
        })
    }]
});

export const ledgerWalletsAtom = atom<LedgerWallet[]>({
    key: 'ledger/wallets',
    default: getLedgerWallets(),
    effects: [
        ({ onSet }) => {
            onSet((ledgerWallets) => {
                setLedgerWallets(ledgerWallets);
            });
        }
    ]
});

export function setLedgerWallets(ledgerWallets: LedgerWallet[]) {
    storage.set(ledgerWalletsKey, JSON.stringify(ledgerWallets));
}
