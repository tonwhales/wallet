import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchExtensionStats } from "../../api/reviews";

export function useExtensionStats(url: string) {
    let res = useQuery({
        queryKey: Queries.Apps(url).Manifest(),
        queryFn: (ctx) => fetchExtensionStats(ctx.queryKey[1]),
    });

    return res.data || null;
}