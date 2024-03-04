import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchPoolApy as fetchPoolApys } from "../../api/fetchPoolApy";
import { useStakingStatus } from "./useStakingStatus";
import { lastTwoApys } from "../../../utils/staking/lastTwoApys";
import { useMemo } from "react";
import { useStakingApy } from "./useStakingApy";

export function usePoolApys(pool: string) {
    return useQuery({
        queryKey: Queries.PoolApy(pool),
        queryFn: () => {
            return fetchPoolApys(pool);
        },
        refetchInterval: 1000 * 60 * 5, // sync every 5 minutes
    }).data;
}

export function usePoolApy(pool: string) {
    const global = useStakingApy()?.apy;
    const apys = usePoolApys(pool);
    const status = useStakingStatus();
    const lastGlobalApys = lastTwoApys(status);
    const lastApy = apys?.at(-1)?.globalApy ?? '0';

    const res = useMemo(() => {
        try {
            const last = parseFloat(lastApy);
            return last === lastGlobalApys[0] ? last : lastGlobalApys[1];
        } catch {
            return global ?? lastGlobalApys[1];
        }
    }, [apys, lastApy, lastGlobalApys, global]);

    return res;
}