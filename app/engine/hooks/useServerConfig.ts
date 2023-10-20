import { useQuery } from "@tanstack/react-query";
import { Queries } from "../queries";
import { fetchConfig } from "../api/fetchConfig";

export function useServerConfig() {
    return useQuery({
        queryKey: Queries.ServerConfig(),
        queryFn: fetchConfig,
    })
}