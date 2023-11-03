import { useRecoilValue } from 'recoil';
import { PasscodeState } from '../../../storage/secureStorage';
import { passcodeState } from '../../state/biometricsAndPasscode';

export function usePasscodeState(): PasscodeState {
    return useRecoilValue(passcodeState);
}