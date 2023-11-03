import { useJettonContent } from './useJettonContent';

export function useJettonMaster(address: string | null) {
    return useJettonContent(address);
}