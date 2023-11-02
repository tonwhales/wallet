import { useRecoilCallback } from 'recoil';
import { networkSelector } from '../../state/network';
import { storagePersistence, storageQuery } from '../../../storage/storage';

export function useSetNetwork() {
    return useRecoilCallback(({ set }) => (network: 'testnet' | 'mainnet') => {
        set(networkSelector, { isTestnet: network === 'testnet' });
        storagePersistence.clearAll();
        storageQuery.clearAll();
    }, []);
}