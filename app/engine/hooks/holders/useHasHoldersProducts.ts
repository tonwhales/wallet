import { Address } from "@ton/core";
import { useHoldersAccounts } from "..";
import { Queries } from "../../queries";
import { queryClient } from "../../clients";
import { getQueryData } from "../../utils/getQueryData";
import { HoldersAccountStatus } from "./useHoldersAccountStatus";
import { HoldersUserState } from "../../api/holders/fetchUserState";
import { HoldersAccounts } from "./useHoldersAccounts";

function hasAccounts(accs: HoldersAccounts | undefined) {
    if (!accs) {
        return false;
    }

    const accounts = accs.accounts.length;
    const cards = accs?.prepaidCards?.length || 0;

    return accounts + cards > 0;
}

export function getHasHoldersProducts(address: string) {
    const queryCache = queryClient.getQueryCache();
    const status = getQueryData<HoldersAccountStatus>(queryCache, Queries.Holders(address).Status());

    const token = (
        !!status &&
        status.state === HoldersUserState.Ok
    ) ? status.token : null;

    const accounts = getQueryData<HoldersAccounts>(queryCache, Queries.Holders(address).Cards(!!token ? 'private' : 'public'));

    return hasAccounts(accounts);
}

export function useHasHoldersProducts(address: string | Address, solanaAddress?: string) {
    const accs = useHoldersAccounts(address, solanaAddress).data;
    return hasAccounts(accs);
}