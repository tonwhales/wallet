import { useRecoilState } from "recoil";
import { pendingRequestsSelector } from "../../state/tonconnect";
import { SendTransactionRequest } from '../../tonconnect/types';

export function useConnectPendingRequests(): [SendTransactionRequest[], (updater: (currVal: SendTransactionRequest[]) => SendTransactionRequest[]) => void] {
    const [value, update] = useRecoilState(pendingRequestsSelector);
    return [value, update];
}