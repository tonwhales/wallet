import { useRecoilCallback } from 'recoil';
import { BiometricsState } from '../../storage/secureStorage';
import { AppState, setAppState } from '../../storage/appState';
import { appStateAtom } from '../state/appState';

export function useSetAppState() {
    return useRecoilCallback(({ set }) => (value: AppState, isTestnet: boolean) => {
        set(appStateAtom, () => {
            setAppState(value, isTestnet);
            return value;
        });
    }, []);
}