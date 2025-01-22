import { atom, selector } from 'recoil';
import { getAppState } from '../../storage/appState';
import { networkSelector } from './network';
import { mixpanelAddWallet, mixpanelIdentify } from '../../analytics/mixpanel';

export const appStateAtom = atom({
    key: 'wallet/appstate',
    default: getAppState(),
    effects: [({ setSelf }) => {
        const stored = getAppState();
        if (stored) {
            setSelf(stored);
        }
    }]
});

export const selectedAccountSelector = selector({
    key: 'wallet/selectedAccount',
    get: ({ get }) => {
        let state = get(appStateAtom);
        let isTestnet = get(networkSelector).isTestnet;

        let selected = (state.selected === -1 || state.selected >= state.addresses.length)
            ? null
            : state.addresses[state.selected];

        if (selected) {
            mixpanelIdentify(selected.address.toString({ testOnly: isTestnet }), isTestnet);
            mixpanelAddWallet(selected.address.toString({ testOnly: isTestnet }), isTestnet);
        }

        if (selected) {
            return {
                ...selected,
                addressString: selected.address.toString({ testOnly: isTestnet }),
            };
        }

        return selected;
    }
});