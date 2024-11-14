import { useSelectedAccount } from "../appstate/useSelectedAccount";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchOldWalletBalances } from "../../api/fetchOldWalletBalances";

export function useOldWalletsBalances() {
    const account = useSelectedAccount();

    const query = useQuery({
        queryKey: Queries.Account(account!.addressString).OldWallets(),
        queryFn: async () => {
            return await fetchOldWalletBalances(account!.publicKey);
        },
        enabled: !!account,
        staleTime: 1000 * 60 * 5,
    });

    try {
        if (query.data) {
            const total = BigInt(query.data.totalBalance);
            const accounts = query.data.accounts;
            return { total, accounts };
        }

        return { total: 0n, accounts: [] };
    } catch {
        return { total: 0n, accounts: [] };
    }

}