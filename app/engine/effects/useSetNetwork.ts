import { useRecoilCallback } from 'recoil';
import { networkSelector } from '../state/network';
import { storagePersistence } from '../../storage/storage';

export function useSetNetwork() {
    return useRecoilCallback(({ set }) => (network: 'testnet' | 'mainnet') => {
        set(networkSelector, { isTestnet: network === 'testnet' });
        storagePersistence.clearAll();
    }, []);
}