import { useSetRecoilState } from 'recoil';
import { biometricsState } from '../../state/biometricsAndPasscode';

export function useSetBiometricsState() {
    return useSetRecoilState(biometricsState);
}