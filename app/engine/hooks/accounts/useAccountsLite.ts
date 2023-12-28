import { useQueries } from "@tanstack/react-query";
import { Address } from "@ton/core";
import { Queries } from "../../queries";
import { useNetwork } from "../network/useNetwork";
import { getLastBlock } from "../../accountWatcher";
import { useClient4 } from "../network/useClient4";

export function useAccountsLite(accounts: Address[]) {
    const { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);
    const queries = useQueries({
        queries: accounts.map(w => ({
            queryKey: Queries.Account(w.toString({ testOnly: isTestnet })).Lite(),
            queryFn: async () => {
                let last = await getLastBlock();
                const res = await client.getAccountLite(last, w);
                return {
                    account: res.account,
                    block: last,
                };
            },
        })),
    });

    return queries.map((q, i) => ({ address: accounts[i], data: q.data?.account })).filter(d => !!d.data);
}