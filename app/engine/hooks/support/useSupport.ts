import { getHoldersToken } from "../holders/useHoldersAccountStatus";
import { HoldersUserState, holdersUrl as resolveHoldersUrl } from "../../api/holders/fetchUserState";
import { queryClient } from "../../clients";
import { Queries } from "../../queries";
import { getQueryData } from "../../utils/getQueryData";
import { HoldersAccounts } from "../holders/useHoldersAccounts";
import { HoldersAccountStatus } from "../holders/useHoldersAccountStatus";
import { useCallback } from "react";
import { useNetwork } from "../network";
import { useSelectedAccount } from "../appstate";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useLedgerTransport } from "../../../fragments/ledger/components/TransportContext";
import { Address } from "@ton/core";

export const useSupport = (options?: { isLedger?: boolean }) => {
    const network = useNetwork();
    const holdersUrl = resolveHoldersUrl(network.isTestnet);
    const queryCache = queryClient.getQueryCache();
    const selected = useSelectedAccount();
    const ledgerContext = useLedgerTransport();
    const _address = options?.isLedger ? Address.parse(ledgerContext.addr!.address) : selected!.address;
    const address = _address.toString({ testOnly: network.isTestnet });
    const status = getQueryData<HoldersAccountStatus>(queryCache, Queries.Holders(address).Status());
    const token = status?.state === HoldersUserState.Ok ? status.token : getHoldersToken(address);
    const accountsStatus = getQueryData<HoldersAccounts>(queryCache, Queries.Holders(address).Cards(!!token ? 'private' : 'public'));
    const navigation = useTypedNavigation();

    const initialState = {
        ...status
            ? {
                user: {
                    status: {
                        state: status.state,
                        kycStatus: status.state === 'need-kyc' ? status.kycStatus : null,
                        suspended: (status as { suspended: boolean | undefined }).suspended === true,
                    },
                    token
                }
            }
            : { address },
        ...accountsStatus?.type === 'private'
            ? { accountsList: accountsStatus.accounts, prepaidCards: accountsStatus.prepaidCards }
            : {},
    };

    const onSupport = useCallback(() => {
        navigation.navigateDAppWebView({
            url: `${holdersUrl}/support`,
            fullScreen: true,
            webViewProps: {
                injectedJavaScriptBeforeContentLoaded: `
                        (() => {
                            window.initialState = ${JSON.stringify(initialState)};
                        })();
                        `,
            },
            useQueryAPI: true
        });
    }, [])

    return {
        onSupport
    }
}