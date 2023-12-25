import { Address } from "@ton/ton";
import { queryClient } from "../clients";
import { Queries } from "../queries";
import { getHoldersToken } from "../hooks/holders/useHoldersAccountStatus";
import { HoldersAccountState, fetchAccountState } from "../api/holders/fetchAccountState";
import { fetchAccountsPublic, fetchAccountsList } from "../api/holders/fetchAccounts";

export async function onHoldersEnroll(account: string, isTestnet: boolean) {
    let address = Address.parse(account).toString({ testOnly: isTestnet });

    const token = getHoldersToken(address);

    if (!token) {
        return { state: HoldersAccountState.NeedEnrollment } as { state: HoldersAccountState.NeedEnrollment }; // This looks amazingly stupid
    }

    const fetched = await fetchAccountState(token);
    if (!fetched) {
        return { state: HoldersAccountState.NeedEnrollment } as { state: HoldersAccountState.NeedEnrollment };
    }
    const status = { ...fetched, token };
    queryClient.setQueryData(Queries.Holders(address).Status(), () => status);

    if (status.state === HoldersAccountState.Ok) {
        let accounts;
        let type = 'public';

        if (token) {
            accounts = await fetchAccountsList(token);
            type = 'private';
        } else {
            accounts = await fetchAccountsPublic(address, isTestnet);
            type = 'public';
        }

        const filtered = accounts?.filter((a) => a.network === (isTestnet ? 'ton-testnet' : 'ton-mainnet'));
        const accountsData = { accounts: filtered, type };
        queryClient.setQueryData(Queries.Holders(address).Cards(!!token ? 'private' : 'public'), () => accountsData);
    }
}