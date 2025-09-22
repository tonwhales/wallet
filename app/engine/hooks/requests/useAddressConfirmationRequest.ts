import { useCallback, useEffect, useState } from "react";
import { createWalletRequest } from "../../api/requests/createWalletRequest";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { useCurrentAddress, useNetwork, useWalletRequests } from "..";

export function useAddressConfirmationRequest(address: string) {
    const authWalletKeys = useKeysAuth();
    const { isTestnet } = useNetwork();
    const currentAddress = useCurrentAddress();
    const [requestId, setRequestId] = useState<string | null>(null);
    const [status, setStatus] = useState<'pending' | 'confirmed' | 'declined' | 'expired' | 'error' | null>(null);

    const { data: requests } = useWalletRequests({
        address: currentAddress.tonAddress.toString({ bounceable: false, testOnly: isTestnet }),
        isTestnet,
        type: 'pending-outgoing',
        refetchInterval: 1000 * 10,
        enabled: !!currentAddress.tonAddress && !!requestId
    });

    const sendRequest = useCallback(async () => {
        const keys = await authWalletKeys.authenticate();
        const res = await createWalletRequest({
            keys,
            requester: currentAddress.tonAddress.toString({ bounceable: false, testOnly: isTestnet }),
            confirmant: address,
            isTestnet: isTestnet
        });
        console.log('res', res);
        setStatus('pending');
        setRequestId(res.requestId);
    }, [address, authWalletKeys, currentAddress, isTestnet]);

    const reset = useCallback(() => {
        setStatus(null);
        setRequestId(null);
    }, []);

    useEffect(() => {
        if (requests && requests.length > 0) {
            setStatus('confirmed');
        }
    }, [requests]);

    return { requestId, sendRequest, status, reset };
}