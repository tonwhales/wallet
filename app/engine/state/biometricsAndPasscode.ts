import { atom } from 'recoil';
import { PasscodeState, getBiometricsState, getPasscodeState, storeBiometricsState, storePasscodeState } from '../../storage/secureStorage';

export const biometricsState = atom({
    key: 'auth/biometricsState',
    default:  getBiometricsState(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            if (!!newValue) {
                storeBiometricsState(newValue);
            }
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