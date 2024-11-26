import { useEffect } from "react";
import { useHoldersAccountStatus } from "./hooks/holders/useHoldersAccountStatus";
import { useSelectedAccount } from "./hooks/appstate/useSelectedAccount";
import { HoldersUserState } from "./api/holders/fetchUserState";
import { useNetwork } from "./hooks/network/useNetwork";
import { watchHoldersAccountUpdates } from './holders/watchHoldersAccountUpdates';
import { useHoldersAccounts } from "./hooks";

export function useHoldersWatcher() {
    const account = useSelectedAccount();
    const { isTestnet } = useNetwork();
    const status = useHoldersAccountStatus(account?.address.toString({ testOnly: isTestnet }) ?? '');
    const cards = useHoldersAccounts(account?.address.toString({ testOnly: isTestnet }) ?? '');

    useEffect(() => {        
        if (status?.data?.state !== HoldersUserState.Ok) {
            return;
        }

        cards.refetch();

        return watchHoldersAccountUpdates(status.data.token, (event) => {
            if (
                event.message === 'state_change'
                || (event.type === 'error' && event.message === 'invalid_token')
            ) {
                status.refetch();
                return;
            }
            if (event.type === 'connected') {
                cards.refetch();
                return;
            }
            if (event.type === 'accounts_changed' || event.type === 'balance_change' || event.type === 'limits_change') {
                cards.refetch();

                return;
            }

            // Refetch cards if prepaid transaction 
            if (event.type === 'prepaid_transaction') {
                cards.refetch();
                return;
            }
        }, isTestnet);
    }, [status.data, cards]);
}