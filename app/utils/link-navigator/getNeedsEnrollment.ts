import { QueryClient } from "@tanstack/react-query";
import { getHoldersToken } from "../../storage/holders";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { getQueryData } from "../../engine/utils/getQueryData";
import { Queries } from "../../engine/queries";
import { getIsConnectAppReady } from "../../engine/hooks/dapps/useIsConnectAppReady";
import { HoldersUserState } from "../../engine/api/holders/fetchUserState";

export function getNeedsEnrollment(url: string, address: string, isTestnet: boolean, queryClient: QueryClient) {

    if (!getHoldersToken(address)) {
        return true;
    }

    const queryCache = queryClient.getQueryCache();
    const status = getQueryData<HoldersAccountStatus>(queryCache, Queries.Holders(address).Status());
    const isHoldersReady = getIsConnectAppReady(url, isTestnet, address);

    if (!isHoldersReady) {
        return true;
    }

    if (!status) {
        return true;
    }

    if (status.state === HoldersUserState.NeedEnrollment) {
        return true;
    }

    return false;
}