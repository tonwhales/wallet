import { useQueries } from "@tanstack/react-query";
import { Address } from "@ton/core";
import { Queries } from "../queries";
import { useNetwork } from "./useNetwork";
import { getLastBlock } from "../accountWatcher";
import { useClient4 } from "./useClient4";

export function useAccountsLite(accounts: Address[]) {
    const { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    const queries = useQueries({
        queries: accounts.map(w => ({
            queryKey: Queries.Account(w.toString({ testOnly: isTestnet })).Lite(),
            queryFn: async () => {
                let last = await getLastBlock();
                const res = await client.getAccountLite(last, w);
                return { address: w, account: res.account };
            },
        })),
    });

    return queries.map(q => q.data).filter(d => !!d);
}