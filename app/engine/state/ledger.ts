import { atom } from 'recoil';
import {getLedgerEnabled, getLedgerWallets, setLedgerEnabled} from '../../storage/appState';
import { sharedStoragePersistence, storage } from '../../storage/storage';
import { LedgerWallet } from '../../fragments/ledger/components/TransportContext';

export const ledgerWalletsKey = 'ledgerWalletsKey';
export const ledgerHiddenJettonsKey = 'ledgerHiddenJettonsKey';

export type LedgerHiddenJettons = Record<string, Record<string, boolean>>;

export const ledgerEnabledState = atom({
    key: 'misc/ledgerEnabledState',
    default: (getLedgerEnabled() || false),
    effects: [({ onSet, setSelf }) => {
        const stored = getLedgerEnabled() || false;
        setSelf(stored);

        onSet((newValue) => {
            setLedgerEnabled(newValue);
        });
    }]
});

export const ledgerWalletsAtom = atom<LedgerWallet[]>({
    key: 'ledger/wallets',
    default: getLedgerWallets(),
    effects: [
        ({ onSet, setSelf }) => {
            const stored = getLedgerWallets();
            setSelf(stored);

            onSet((ledgerWallets) => {
                setLedgerWallets(ledgerWallets);
            });
        }
    ]
});

export function setLedgerWallets(ledgerWallets: LedgerWallet[]) {
    storage.set(ledgerWalletsKey, JSON.stringify(ledgerWallets));
}

export function setLedgerHiddenJettons(ledgerHiddenJettons: LedgerHiddenJettons) {
    sharedStoragePersistence.set(ledgerHiddenJettonsKey, JSON.stringify(ledgerHiddenJettons));
}

function getLedgerHiddenJettons(): LedgerHiddenJettons {
    let ledgerHiddenJettons = sharedStoragePersistence.getString(ledgerHiddenJettonsKey);
    return ledgerHiddenJettons ? JSON.parse(ledgerHiddenJettons) : {};
}

export const ledgerHiddenJettonsAtom = atom({
    key: 'ledger/hiddenJettons',
    default: getLedgerHiddenJettons(),
    effects: [
        ({ onSet, setSelf }) => {
            const stored = getLedgerHiddenJettons();
            setSelf(stored);

            onSet((ledgerHiddenJettons) => {
                setLedgerHiddenJettons(ledgerHiddenJettons);
            });
        }
    ]
});
