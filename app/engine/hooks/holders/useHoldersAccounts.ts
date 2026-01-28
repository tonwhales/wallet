import { Address } from "@ton/core";
import { useNetwork } from "../network/useNetwork";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { GeneralHoldersAccount, PrePaidHoldersCard, fetchAccountsList, fetchAccountsPublic } from "../../api/holders/fetchAccounts";
import { useHoldersAccountStatus } from "./useHoldersAccountStatus";
import { HoldersUserState } from "../../api/holders/fetchUserState";
import { updateProvisioningCredentials } from "../../holders/updateProvisioningCredentials";
import axios from "axios";
import { deleteHoldersToken } from "../../../storage/holders";
import { saveErrorLog } from "../../../storage";

export type HoldersAccounts = {
    accounts: GeneralHoldersAccount[],
    type: 'public' | 'private',
    prepaidCards?: PrePaidHoldersCard[]
}

const networkFilter = (account: GeneralHoldersAccount) => {
    switch (account.network) {
        case 'ton-testnet':
        case 'ton-mainnet':
        case 'solana':
            return true;
        default:
            return false;
    }
}

export function useHoldersAccounts(address: string | Address | undefined, solanaAddress?: string | null) {
    let { isTestnet } = useNetwork();
    let status = useHoldersAccountStatus(address).data;

    const addressString = useMemo(() => {
        if (address instanceof Address) {
            return address.toString({ testOnly: isTestnet });
        }
        return address;
    }, [address, isTestnet]);

    const token = (
        !!status &&
        status.state === HoldersUserState.Ok
    ) ? status.token : null;

    let query = useQuery({
        queryKey: Queries.Holders(addressString!).Cards(!!token ? 'private' : 'public'),
        enabled: !!addressString,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchInterval: 45000,
        staleTime: 35000,
        queryFn: async () => {
            try {
                let accounts;
                let prepaidCards: PrePaidHoldersCard[] | undefined;
                let type = 'public';

                if (token) {
                    const res = await fetchAccountsList(token, isTestnet);

                    if (!res) {
                        deleteHoldersToken(addressString!);
                        throw new Error('Unauthorized');
                    }

                    type = 'private';
                    accounts = res?.accounts;
                    prepaidCards = res?.prepaidCards;

                    // fetch apple pay credentials and update provisioning credentials cache
                    await updateProvisioningCredentials(addressString!, isTestnet);
                } else {
                    accounts = await fetchAccountsPublic({ address: addressString!, isTestnet, solanaAddress: solanaAddress || undefined });
                    type = 'public';
                }

                const filtered = accounts?.filter((a) => networkFilter(a)) ?? [];

                return {
                    accounts: filtered.map((a) => {
                        try {
                            BigInt(a.balance);
                            return { ...a, balance: a.balance };
                        } catch (error) {
                            saveErrorLog({
                                message: error instanceof Error ? error.message : String(error),
                                stack: error instanceof Error ? error.stack : undefined,
                                url: 'useHoldersAccounts:parseBalance',
                                additionalData: { accountId: a.id }
                            });
                            return { ...a, balance: '0' }
                        }
                    }), type, prepaidCards
                } as HoldersAccounts;
            } catch (error) {
                saveErrorLog({
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    url: 'useHoldersAccounts:queryFn',
                    additionalData: { isTestnet, statusCode: axios.isAxiosError(error) ? error.response?.status : undefined }
                });
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    deleteHoldersToken(addressString!);
                    throw new Error('Unauthorized');
                } else {
                    throw error;
                }
            }
        }
    });

    return query;
}