import { Address } from "@ton/core";
import { useClient4, useNetwork } from "../network";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { getLiquidStakingAddress } from "../../../utils/KnownPools";
import { LiquidStakingPool } from "../../../utils/LiquidStakingContract";
import { LiquidStakingWallet } from "../../../utils/LiquidStakingWallet";

export function useLiquidStakingMember(member: Address | null | undefined) {
    const network = useNetwork();
    const client = useClient4(network.isTestnet);
    const pool = getLiquidStakingAddress(network.isTestnet);

    if (!member) {
        return null;
    }

    return useQuery({
        queryFn: async () => {
            let contract = LiquidStakingPool.createFromAddress(pool);
            let openedContract = client.open(contract);
            let walletAddress = await openedContract.getWalletAddress(member);
            let walletContract = client.open(LiquidStakingWallet.createFromAddress(walletAddress));

            return await walletContract.getState();
        },
        refetchOnMount: true,
        refetchInterval: 10_000,
        queryKey: Queries.StakingLiquidMember(pool.toString({ testOnly: network.isTestnet }), member.toString({ testOnly: network.isTestnet })),
    });
}