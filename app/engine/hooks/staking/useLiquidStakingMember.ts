import { Address } from "@ton/core";
import { useNetwork } from "../network";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { getLiquidStakingAddress } from "../../../utils/KnownPools";
import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";
import axios from "axios";

const liquidStakingMemberScheme = z.object({
    balance: z.string(),
    owner: z.string(),
    master: z.string(),
    code: z.string(),
    pendingWithdrawals: z.record(z.string())
}).nullish();

function fetchLiquidStakingMemberQueryFn(isTestnet: boolean, account: Address) {
    return async () => {
        const url = `${whalesConnectEndpoint}/member/staking/liquid/info`;
        const res = await axios.post(url, {
            isTestnet,
            address: account.toString({ testOnly: isTestnet })
        });

        const parsed = liquidStakingMemberScheme.safeParse(res.data);

        if (!parsed.success) {
            throw new Error('Invalid response');
        }

        return parsed.data;
    };
}

export function useLiquidStakingMember(account: Address | null | undefined) {
    const { isTestnet } = useNetwork();
    const pool = getLiquidStakingAddress(isTestnet);

    return useQuery({
        queryFn: fetchLiquidStakingMemberQueryFn(isTestnet, account!),
        refetchOnMount: true,
        queryKey: Queries.StakingLiquidMember(
            pool.toString({ testOnly: isTestnet }),
            account!.toString({ testOnly: isTestnet })
        ),
        staleTime: 1000 * 30,
        enabled: !!account
    });
}