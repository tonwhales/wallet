import { atom, selector } from 'recoil';
import { BiometricsState, getBiometricsState, getPasscodeState, storeBiometricsState } from '../../storage/secureStorage';

export const biometricsState = atom({
    key: 'auth/biometricsState',
    default:  (getBiometricsState() || BiometricsState.NotSet),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeBiometricsState(newValue);
        })
    }]
});

export const passcodeState = selector({
    key: 'auth/passcodeState',
    get: () => getPasscodeState(),
});