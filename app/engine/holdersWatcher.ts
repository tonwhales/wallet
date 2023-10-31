import { useEffect } from "react";
import { useHoldersAccountStatus } from "./hooks/holders/useHoldersAccountStatus";
import { useSelectedAccount } from "./hooks/useSelectedAccount";
import { HoldersAccountState } from "./api/holders/fetchAccountState";
import { useHoldersCards } from "./hooks/holders/useHoldersCards";
import { useNetwork } from "./hooks/useNetwork";
import { watchHoldersAccountUpdates } from './holders/watchHoldersAccountUpdates';

export function useHoldersWatcher() {
    const account = useSelectedAccount();
    const { isTestnet } = useNetwork();
    const status = useHoldersAccountStatus(account?.address.toString({ testOnly: isTestnet }) ?? '');
    const cards = useHoldersCards(account?.address.toString({ testOnly: isTestnet }) ?? '');

    useEffect(() => {
        let watcher: null | (() => void) = null;
        if (!status.data?.state || status.data.state === HoldersAccountState.NeedEnrollment) {
            return;
        }
        cards.refetch();
        watcher = watchHoldersAccountUpdates(status.data.token, (event) => {
            if (
                event.type === 'error'
                && event.message === 'invalid_token'
                || event.message === 'state_change'
            ) {
                status.refetch();
            }
            if (event.type === 'accounts_changed' || event.type === 'balance_change' || event.type === 'limits_change') {
                cards.refetch();
                // TODO
                // this.syncCardsTransactions();
            }
        });

        return () => {
            if (!!watcher) {
                watcher();
                watcher = null;
            }
        };
    }, [status.data, cards]);
}