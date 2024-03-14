import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchContractInfo } from "../../api/fetchContractInfo";

export function useContractInfo(addressString: string) {
    return useQuery({
        queryKey: Queries.ContractInfo(addressString),
        queryFn: async () => {
            if (!addressString) {
                return null;
            }
            return await fetchContractInfo(addressString);
        },
        staleTime: Infinity,
    }).data ?? null;
}