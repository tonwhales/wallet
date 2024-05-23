import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchContractInfo } from "../../api/fetchContractInfo";

export function useContractInfo(addressString: string | null) {
    const query = useQuery({
        queryKey: Queries.ContractInfo(addressString ?? ''),
        queryFn: async () => {
            if (!addressString) {
                return null;
            }
            return await fetchContractInfo(addressString);
        },
        refetchOnMount: true,
        staleTime: Infinity,
    });

    return query.data ?? null;
}