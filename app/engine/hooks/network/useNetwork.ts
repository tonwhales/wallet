import { useRecoilValue } from 'recoil';
import { networkSelector } from '../../state/network';

export function useNetwork() {
    return useRecoilValue(networkSelector);
}