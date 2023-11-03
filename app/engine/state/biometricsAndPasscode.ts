import { atom } from 'recoil';
import { BiometricsState, PasscodeState, getBiometricsState, getPasscodeState, storeBiometricsState, storePasscodeState } from '../../storage/secureStorage';

export const biometricsState = atom({
    key: 'auth/biometricsState',
    default:  (getBiometricsState() || BiometricsState.NotSet),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storeBiometricsState(newValue);
        })
    }]
});

export const passcodeState = atom({
    key: 'auth/passcodeState',
    default: (getPasscodeState() || PasscodeState.NotSet),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            storePasscodeState(newValue);
        })
    }]
});