import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "..";
import { getLiquidStakingAddress } from "../../../utils/KnownPools";
import { Queries } from "../../queries";
import { fetchLiquidStakingStatus } from "../../api/fetchLiquidStakingStatus";
import { Address } from "@ton/core";

export function useLiquidStaking() {
  const network = useNetwork();
  const pool = getLiquidStakingAddress(network.isTestnet);

  return useQuery({
    queryFn: async () => {
      
      const status = await fetchLiquidStakingStatus(network.isTestnet);

      if (!status) {
        return null;
      }

      return {
        ...status,
        rateDeposit: BigInt(status.rateDeposit),
        rateWithdraw: BigInt(status.rateWithdraw),
        extras: {
          ...status.extras,
          minStake: BigInt(status.extras.minStake),
          depositFee: BigInt(status.extras.depositFee),
          withdrawFee: BigInt(status.extras.withdrawFee),
          receiptPrice: BigInt(status.extras.receiptPrice),
          address: Address.parse(status.extras.address),
        },
        balances: {
          minterSupply: BigInt(status.balances.minterSupply),
          totalBalance: BigInt(status.balances.totalBalance),
          totalSent: BigInt(status.balances.totalSent),
          totalPendingWithdraw: BigInt(status.balances.totalPendingWithdraw),
          totalBalanceWithdraw: BigInt(status.balances.totalBalanceWithdraw),
        }
      }
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    queryKey: Queries.StakingLiquid(pool.toString({ testOnly: network.isTestnet })),
  });
}