import { Address } from "@ton/ton";
import { queryClient } from "../clients";
import { Queries } from "../queries";
import { getHoldersToken } from "../../storage/holders";
import { HoldersUserState, fetchUserState } from "../api/holders/fetchUserState";
import { fetchAccountsPublic, fetchAccountsList } from "../api/holders/fetchAccounts";
import { updateProvisioningCredentials } from "../holders/updateProvisioningCredentials";

export async function onHoldersEnroll({account, isTestnet, solanaAddress, ethereumAddress}: {account: string, isTestnet: boolean, solanaAddress?: string, ethereumAddress?: string}) {
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
            accounts = await fetchAccountsPublic({ address, isTestnet, solanaAddress, ethereumAddress });
            type = 'public';
        }

        const supportedNetworks = new Set([
            'ton-mainnet', 'ton-testnet', 'solana',
            'ethereum-mainnet', 'ethereum-sepolia',
            'base-mainnet', 'base-sepolia', 'ether'
        ]);
        const filtered = accounts?.filter((a) => supportedNetworks.has(a.network));

        const sorted = filtered?.sort((a, b) => {
            if ((a.cards?.length ?? 0) > (b.cards?.length ?? 0)) return -1;
            if ((a.cards?.length ?? 0) < (b.cards?.length ?? 0)) return 1;
            return 0;
        });

        const accountsData = { accounts: sorted, type, prepaidCards };

        queryClient.setQueryData(Queries.Holders(address).Cards(!!token ? 'private' : 'public'), () => accountsData);
    }
}