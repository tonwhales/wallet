import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchServiceAddressCheck, ServiceAddressInfo } from "../../api/fetchServiceAddressCheck";

/**
 * Fetches service address metadata when an address is provided.
 *
 * @param address - The service address to check. If `null`, the hook does not perform a fetch and will return `null`.
 * @returns The `ServiceAddressInfo` for the provided address, or `null` if no address was provided or data is unavailable.
 */
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