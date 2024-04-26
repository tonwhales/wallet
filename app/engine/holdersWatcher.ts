import { useEffect } from "react";
import { useHoldersAccountStatus } from "./hooks/holders/useHoldersAccountStatus";
import { useSelectedAccount } from "./hooks/appstate/useSelectedAccount";
import { HoldersAccountState } from "./api/holders/fetchAccountState";
import { useNetwork } from "./hooks/network/useNetwork";
import { watchHoldersAccountUpdates } from './holders/watchHoldersAccountUpdates';
import { queryClient } from "./clients";
import { Queries } from "./queries";
import { useHoldersAccounts } from "./hooks";

export function useHoldersWatcher() {
    const account = useSelectedAccount();
    const { isTestnet } = useNetwork();
    const status = useHoldersAccountStatus(account?.address.toString({ testOnly: isTestnet }) ?? '');
    const cards = useHoldersAccounts(account?.address.toString({ testOnly: isTestnet }) ?? '');

    useEffect(() => {
        if (status?.data?.state !== HoldersAccountState.Ok) {
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
                queryClient.refetchQueries({ queryKey: Queries.Holders(account?.address.toString({ testOnly: isTestnet }) ?? '').Notifications(event.card) })

                return;
                // TODO
                // this.syncCardsTransactions();
            }
        }, isTestnet);
    }, [status.data, cards]);
}