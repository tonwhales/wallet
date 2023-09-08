import { atom, selector } from 'recoil';
import { getAppState } from '../../storage/appState';

export const appStateAtom = atom({
    key: 'wallet/appstate',
    default: getAppState(),
});