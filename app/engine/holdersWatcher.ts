import { useEffect } from "react";
import { useHoldersAccountStatus } from "./hooks/holders/useHoldersAccountStatus";
import { useSelectedAccount } from "./hooks/appstate/useSelectedAccount";
import { HoldersUserState } from "./api/holders/fetchUserState";
import { useNetwork } from "./hooks/network/useNetwork";
import { watchHoldersAccountUpdates } from './holders/watchHoldersAccountUpdates';
import { useHoldersAccounts } from "./hooks";
import { Queries } from "./queries";
import { queryClient } from "./clients";

export function useHoldersWatcher() {
    const account = useSelectedAccount();
    const { isTestnet } = useNetwork();
    const accAddressString = account?.address.toString({ testOnly: isTestnet }) ?? '';
    const status = useHoldersAccountStatus(accAddressString);
    const cards = useHoldersAccounts(accAddressString);
    const otpKey = Queries.Holders(accAddressString).OPT();

    useEffect(() => {
        if (status?.data?.state !== HoldersUserState.Ok) {
            return;
        }

        cards.refetch();

        return watchHoldersAccountUpdates(status.data.token, (event) => {
            switch (event.type) {
                case 'connected':
                    cards.refetch();
                    break;
                case 'accounts_changed':
                case 'balance_change':
                case 'limits_change':
                    cards.refetch();
                    break;
                case 'prepaid_transaction':
                    cards.refetch();
                    break;
                case 'state_change':
                    status.refetch();
                    break;
                case 'error':
                    if (event.message === 'invalid_token') {
                        status.refetch();
                    }
                    break;
                case 'inapp_otp':
                    queryClient.invalidateQueries(otpKey);
                    break;
            }
        }, isTestnet);
    }, [status.data, cards, otpKey]);
}