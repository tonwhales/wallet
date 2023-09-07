import { useRecoilCallback } from 'recoil';
import { BiometricsState } from '../../storage/secureStorage';
import { AppState, setAppState } from '../../storage/appState';
import { appStateSelector, appStateBuster } from '../state/appState';

export function useSetAppState() {
    return useRecoilCallback(({ set }) => (value: AppState, isTestnet: boolean) => {
        set(appStateBuster, (v) => {
            setAppState(value, isTestnet);
            console.warn('set app state', value);
            return v + 1;
        });
    }, []);
}