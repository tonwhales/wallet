import { useRecoilCallback } from 'recoil';
import { BiometricsState } from '../../storage/secureStorage';
import { AppState, setAppState } from '../../storage/appState';
import { appStateSelector } from '../state/appState';

export function useSetAppState() {
    return useRecoilCallback(({ reset }) => (value: AppState, isTestnet: boolean) => {
        setAppState(value, isTestnet);
    }, []);
}