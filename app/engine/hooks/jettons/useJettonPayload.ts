import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchJettonPayload } from "../../api/fetchJettonPayload";
import { queryClient } from "../../clients";
import { getQueryData } from "../../utils/getQueryData";
import { MintlessJetton } from "../../api/fetchMintlessHints";
import { Address } from "@ton/core";

export function useJettonPayload(account?: string, masterAddress?: string) {
    const enabled = !!account && !!masterAddress;
    
    const query = useQuery({
        queryKey: Queries.Jettons().Address(account || '').WalletPayload(masterAddress || ''),
        queryFn: async () => {
            if (!account || !masterAddress) {
                return null;
            }

            const queryCache = queryClient.getQueryCache();
            const mintlessHints = getQueryData<MintlessJetton[]>(queryCache, Queries.Mintless(account!)) || [];
            const mintlessJetton = mintlessHints.find(h => Address.parse(masterAddress).equals(Address.parse(h.jetton.address)))?.jetton;

            if (!mintlessJetton) {
                return null;
            }

            const customPayloadApiUri = mintlessJetton.customPayloadApiUri;
            const res = await fetchJettonPayload(account!, masterAddress!, customPayloadApiUri);
            return res;
        },
        enabled,
        staleTime: 1000 * 5,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });

    return {
        data: query.data,
        loading: (query.isFetching || query.isLoading) && enabled,
        isError: query.isError,
    }
}