import { useRecoilValue, useSetRecoilState } from "recoil";
import { pendingRequestsState } from "../../state/tonconnect";
import { SendTransactionRequest } from '../../tonconnect/types';

export function useConnectPendingRequests(): [SendTransactionRequest[], (newState: SendTransactionRequest[]) => void] {
    const value = useRecoilValue(pendingRequestsState);
    const update = useSetRecoilState(pendingRequestsState);

    return [value, update];
}