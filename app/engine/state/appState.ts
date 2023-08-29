import { atom, selector } from 'recoil';
import { getAppState } from '../../storage/appState';

const appStateVersion = atom({
    key: 'wallet/appstate/version',
    default: 0,
    
})

export const appStateSelector = selector({
    key: 'wallet/appstate',
    get: () => getAppState()
});