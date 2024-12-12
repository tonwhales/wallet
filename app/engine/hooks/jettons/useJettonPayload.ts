import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchJettonPayload } from "../../api/fetchJettonPayload";
import { queryClient } from "../../clients";
import { getQueryData } from "../../utils/getQueryData";
import { HintsFull } from "./useHintsFull";

export function useJettonPayload(account?: string, masterAddress?: string) {
    const enabled = !!account && !!masterAddress;

    const query = useQuery({
        queryKey: Queries.Jettons().Address(account || '').WalletPayload(masterAddress || ''),
        queryFn: async () => {
            if (!account || !masterAddress) {
                return null;
            }

            const queryCache = queryClient.getQueryCache();
            const fullHints = getQueryData<HintsFull>(queryCache, Queries.HintsFull(account!));
            const index = fullHints?.addressesIndex?.[masterAddress!];

            if (index === undefined) {
                return null;
            }

            const hint = fullHints?.hints[index];

            if (!hint) {
                return null;
            }

            if (!hint?.extensions?.includes('custom_payload')) {
                return null;
            }

            const customPayloadApiUri = hint.jetton.customPayloadApiUri;
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