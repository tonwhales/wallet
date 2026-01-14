import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchServiceAddressCheck, ServiceAddressInfo } from "../../api/fetchServiceAddressCheck";

export function useServiceAddressCheck(address: string | null): ServiceAddressInfo | null {
    const query = useQuery({
        queryKey: Queries.ServiceAddress(address ?? ''),
        queryFn: async () => {
            if (!address) {
                return null;
            }
            return await fetchServiceAddressCheck(address);
        },
        enabled: !!address,
        refetchOnMount: true,
        staleTime: 1000 * 60 * 5
    });

    return query.data ?? null;
}