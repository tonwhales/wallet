import { Address } from "@ton/ton";
import { queryClient } from "../clients";
import { Queries } from "../queries";
import { getHoldersToken } from "../../storage/holders";
import { HoldersUserState, fetchUserState } from "../api/holders/fetchUserState";
import { fetchAccountsPublic, fetchAccountsList } from "../api/holders/fetchAccounts";
import { updateProvisioningCredentials } from "../holders/updateProvisioningCredentials";

export async function onHoldersEnroll({account, isTestnet, solanaAddress}: {account: string, isTestnet: boolean, solanaAddress?: string}) {
    const address = Address.parse(account).toString({ testOnly: isTestnet });

    const token = getHoldersToken(address);

    if (!token) {
        return { state: HoldersUserState.NeedEnrollment } as { state: HoldersUserState.NeedEnrollment }; // This looks amazingly stupid
    }

    const fetched = await fetchUserState(token, isTestnet);
    if (!fetched) {
        return { state: HoldersUserState.NeedEnrollment } as { state: HoldersUserState.NeedEnrollment };
    }
    const status = { ...fetched, token };
    queryClient.setQueryData(Queries.Holders(address).Status(), () => status);

    if (status.state === HoldersUserState.Ok) {
        let accounts;
        let prepaidCards;
        let type = 'public';

        if (token) {
            const res = await fetchAccountsList(token, isTestnet);
            accounts = res?.accounts;
            prepaidCards = res?.prepaidCards;
            type = 'private';
            // fetch apple pay credentials and update provisioning credentials cache
            await updateProvisioningCredentials(address, isTestnet);
        } else {
            accounts = await fetchAccountsPublic({ address, isTestnet, solanaAddress });
            type = 'public';
        }

        const filtered = accounts?.filter((a) => a.network === (isTestnet ? 'ton-testnet' : 'ton-mainnet'));

        const sorted = filtered?.sort((a, b) => {
            if ((a.cards?.length ?? 0) > (b.cards?.length ?? 0)) return -1;
            if ((a.cards?.length ?? 0) < (b.cards?.length ?? 0)) return 1;
            return 0;
        });

        const accountsData = { accounts: sorted, type, prepaidCards };

        queryClient.setQueryData(Queries.Holders(address).Cards(!!token ? 'private' : 'public'), () => accountsData);
    }
}