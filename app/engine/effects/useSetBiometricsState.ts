import { useRecoilCallback } from 'recoil';
import { BiometricsState } from '../../storage/secureStorage';

export function useSetBiometricsState() {
    return useRecoilCallback(({ reset }) => (value) => {
         
    }, []);
}