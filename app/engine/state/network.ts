import { DefaultValue, atom, selector } from 'recoil';
import { persistedBooleanEffect } from '../utils/mmkvPersistanceEffects';
import { storage } from '../../storage/storage';
import * as Application from 'expo-application';
import { log } from '../../utils/log';

export const isTestnetKey = 'isTestnet';

export const IS_SANDBOX = Application.applicationId === 'com.tonhub.app.testnet' ||
    Application.applicationId === 'com.tonhub.app.debug.testnet' ||
    Application.applicationId === 'com.tonhub.wallet.testnet' ||
    Application.applicationId === 'com.tonhub.wallet.testnet.debug';

const isTestnetAtom = atom({
    key: 'wallet/network/isTestnet',
    effects: [persistedBooleanEffect(storage, isTestnetKey)]
});

export const networkSelector = selector({
    key: 'wallet/network',
    get: ({ get }) => {
        if (IS_SANDBOX) {
            return { isTestnet: true };
        }

        return { isTestnet: get(isTestnetAtom) || false };
    },
    set: ({ set }, newValue) => {
        if (IS_SANDBOX) {
            log('[network] attempt to change network in Sandbox');
            return; // ignore
        }
        if (newValue instanceof DefaultValue) {
            newValue = { isTestnet: false };
        }
        set(isTestnetAtom, newValue.isTestnet);
    }
});