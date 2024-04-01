import { useQuery } from "@tanstack/react-query";
import { useClient4, useNetwork } from "..";
import { getLiquidStakingAddress } from "../../../utils/KnownPools";
import { Queries } from "../../queries";
import { LiquidStakingPool } from "../../../utils/LiquidStakingContract";
import { fetchStakingStatus } from "../../api/fetchStakingStatus";

export function useLiquidStaking() {
  const network = useNetwork();
  const client = useClient4(network.isTestnet);
  const pool = getLiquidStakingAddress(network.isTestnet);

  return useQuery({
    queryFn: async () => {
      const status = await fetchStakingStatus(client, network.isTestnet);

      if (!status) {
        return null;
      }

      const contract = client.open(LiquidStakingPool.createFromAddress(pool));
      const poolStatus = await contract.getPoolStatus(pool, status, network.isTestnet)
      
      return poolStatus;
    },
    refetchInterval: 5 * 60_000, // every 5 minutes
    refetchOnMount: true,
    queryKey: Queries.StakingLiquid(pool.toString({ testOnly: network.isTestnet })),
  });
}