import { atom, selector } from 'recoil';
import { getAppState } from '../../storage/appState';

export const appStateBuster = atom({
    key: 'wallet/appstate/version',
    default: 0,
});

export const appStateSelector = selector({
    key: 'wallet/appstate',
    cachePolicy_UNSTABLE: { eviction: 'most-recent' },
    get: ({ get }) => {
        get(appStateBuster);

        let state = getAppState();

        return { ...state };
    }
});