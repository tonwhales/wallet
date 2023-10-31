import { Address } from '@ton/core';
import { useJettonContent } from './basic/useJettonContent';
import { useNetwork } from './useNetwork';

export function useJettonMaster(address: string | null) {
    return useJettonContent(address);
}