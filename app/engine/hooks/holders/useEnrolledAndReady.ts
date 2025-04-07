import { useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useSelectedAccount } from "..";
import { HoldersUserState } from "../../api/holders/fetchUserState";
import { holdersUrl as resolveHoldersUrl } from "../../api/holders/fetchUserState";

export function useEnrolledAndReady(address?: string) {
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const holdersUrl = resolveHoldersUrl(isTestnet);
    const _address = address ?? selected!.address.toString({ testOnly: isTestnet });
    const status = useHoldersAccountStatus(_address).data;
    const isTonconnectReady = useIsConnectAppReady(holdersUrl, _address);

    const enrolled = status?.state !== HoldersUserState.NeedEnrollment
        && status?.state !== HoldersUserState.NoRef;

    return enrolled && isTonconnectReady;
}