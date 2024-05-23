import { Address } from "@ton/core";
import { useClient4, useNetwork } from "../network";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { getLiquidStakingAddress } from "../../../utils/KnownPools";
import { LiquidStakingWallet } from "../../../utils/LiquidStakingWallet";
import { TonClient4 } from "@ton/ton";

function fetchLiquidStakingMemberQueryFn(client: TonClient4, pool: Address, member: Address) {
    return async () => {
        const walletAddress = LiquidStakingWallet.contractAddress(member, pool);
        const walletContract = client.open(LiquidStakingWallet.createFromAddress(walletAddress));

        const state = await walletContract.getState();

        return state?.data ?? null;
    };
}

export function useLiquidStakingMember(member: Address | null | undefined) {
    const network = useNetwork();
    const client = useClient4(network.isTestnet);
    const pool = getLiquidStakingAddress(network.isTestnet);

    if (!member) {
        return null;
    }

    return useQuery({
        queryFn: fetchLiquidStakingMemberQueryFn(client, pool, member),
        refetchOnMount: true,
        queryKey: Queries.StakingLiquidMember(pool.toString({ testOnly: network.isTestnet }), member.toString({ testOnly: network.isTestnet })),
        staleTime: 1000 * 30
    });
}