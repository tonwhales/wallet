import { useRecoilState } from "recoil";
import { pendingRequestsSelector } from "../../state/tonconnect";
import { PendingTonconnectRequest } from '../../tonconnect/types';

export function useConnectPendingRequests(): [
    PendingTonconnectRequest[],
    (updater: (currVal: PendingTonconnectRequest[]) => PendingTonconnectRequest[]) => void
] {
    return useRecoilState(pendingRequestsSelector);
}