import { useJettonContent } from './basic/useJettonContent';

export function useJettonMaster(address: string | null) {
    return useJettonContent(address);
}