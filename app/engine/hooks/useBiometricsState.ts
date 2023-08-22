import { BiometricsState } from '../../storage/secureStorage';

export function useBiometricsState(): BiometricsState {
    return BiometricsState.InUse;
}