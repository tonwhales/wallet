import { useCallback, useState } from "react";
import { createWalletRequest } from "../../api/requests/createWalletRequest";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { useCurrentAddress, useNetwork } from "..";
import { walletRequestsState } from "../../useWalletRequestsWatcher";
import { useRecoilState } from "recoil";

export function useAddressConfirmationRequest(address: string) {
    const authWalletKeys = useKeysAuth();
    const { isTestnet } = useNetwork();
    const currentAddress = useCurrentAddress();
    const [requestId, setRequestId] = useState<string | null>(null);
    const addressKey = currentAddress.tonAddress.toString({ bounceable: false, testOnly: isTestnet }) || '';
    const [requests, setRequests] = useRecoilState(walletRequestsState(addressKey));
    const status: 'pending' | 'confirmed' | 'declined' | 'expired' | 'not-requested' = requests.find(r => r.requestId === requestId)?.status || 'not-requested';

    const sendRequest = useCallback(async () => {
        const keys = await authWalletKeys.authenticate();
        const res = await createWalletRequest({
            keys,
            requester: currentAddress.tonAddress.toString({ bounceable: false, testOnly: isTestnet }),
            confirmant: address,
            isTestnet: isTestnet
        });

        setRequests(prev => [...prev, res]);
        setRequestId(res.requestId);

    }, [address, authWalletKeys, currentAddress, isTestnet]);

    const reset = useCallback(() => {
        setRequestId(null);
    }, []);

    return { requestId, sendRequest, status, reset };
}