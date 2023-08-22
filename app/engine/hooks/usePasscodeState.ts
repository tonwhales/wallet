import { PasscodeState } from '../../storage/secureStorage';

export function usePasscodeState(): PasscodeState {
    return PasscodeState.Set;
}