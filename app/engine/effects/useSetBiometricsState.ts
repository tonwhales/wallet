import { useRecoilCallback } from 'recoil';
import { BiometricsState } from '../../storage/secureStorage';
import { biometricsState } from '../state/biometricsAndPasscode';

export function useSetBiometricsState() {
    return useRecoilCallback(({ set }) => (value: BiometricsState) => {
        set(biometricsState, () => value);
    }, []);
}