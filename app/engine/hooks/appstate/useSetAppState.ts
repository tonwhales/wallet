import { useRecoilCallback } from 'recoil';
import { AppState, setAppState } from '../../../storage/appState';
import { appStateAtom } from '../../state/appState';
import { connectExtensionsState, loadExtensionsStored } from '../../state/tonconnect';

export function useSetAppState() {
    return useRecoilCallback(({ set }) => (value: AppState, isTestnet: boolean) => {
        set(appStateAtom, () => {
            setAppState(value, isTestnet);
            set(connectExtensionsState, loadExtensionsStored());
            return value;
        });
    }, []);
}