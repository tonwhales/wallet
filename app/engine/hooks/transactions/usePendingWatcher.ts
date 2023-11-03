import { useSetRecoilState } from "recoil";
import { useAccountLite } from "../accounts/useAccountLite";
import { useSelectedAccount } from "../appstate/useSelectedAccount";
import { pendingTransactionsState } from "../../state/pending";
import { useEffect } from "react";

export function usePendingWatcher() {

    const account = useSelectedAccount();
    const lite = useAccountLite(account?.address);
    const setPending = useSetRecoilState(pendingTransactionsState);

    useEffect(() => {
        setPending([]); // on account change or clear pending transactions
    }, [lite]);
}