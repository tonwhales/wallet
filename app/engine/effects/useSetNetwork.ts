import { useRecoilCallback } from 'recoil';
import { isTestnetAtom } from '../state/network';
import { storagePersistence } from '../../storage/storage';

export function useSetNetwork() {
    return useRecoilCallback(({ set }) => (network: 'testnet' | 'mainnet') => {
        set(isTestnetAtom, network === 'testnet');
        storagePersistence.clearAll();
    }, []);
}