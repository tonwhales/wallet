import { useQuery } from "@tanstack/react-query";
import { Address } from "@ton/core";
import { Queries } from "../../queries";
import { NominatorPeriod, fetchStakingNominator } from "../../api/fetchStakingNominator";

export function useNominatorInfo(
    pool: Address,
    nominator: Address,
    fixedPeriod: NominatorPeriod,
    isTestnet: boolean
) {
    return useQuery({
        queryFn: async (key) => {
            const period = fixedPeriod === 'allTime' ? undefined : fixedPeriod;
            return fetchStakingNominator({
                nominator,
                pool,
                isTestnet,
                fixedPeriod: period,
                timeout: 120_000
            });
        },
        staleTime: 1000 * 60 * 60,
        queryKey: Queries.StakingChart(pool.toString(), fixedPeriod, nominator.toString({ testOnly: isTestnet })),
    });
}