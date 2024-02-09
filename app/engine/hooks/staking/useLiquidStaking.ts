import { Address, beginCell } from "@ton/core";
import { useClient4, useNetwork } from "../network";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { getLiquidStakingAddress } from "../../../utils/KnownPools";
import { backoff } from "../../../utils/time";
import { getLastBlock } from "../../accountWatcher";

export function useLiquidStaking(member: Address) {
    const network = useNetwork();
    const pool = getLiquidStakingAddress(network.isTestnet);
    const client = useClient4(network.isTestnet);

    return useQuery({
        queryFn: async (key) => {
            let walletAddress = await client.runMethod(
                await getLastBlock(), pool, 'get_wallet_address',
                [{ type: 'slice', cell: beginCell().storeAddress(member).endCell() }]
            );

            
            let state = await await client.runMethod(
                await getLastBlock(), walletAddress, ''
            );

            if (state.state.type !== 'active' || !state.state.data) {
                return null;
            }

            let ds = Cell.fromBoc(state.state.data)[0].beginParse();
            return {
                data: {
                    balance: ds.loadCoins(),
                    owner: ds.loadAddress(),
                    master: ds.loadAddress(),
                    code: ds.loadRef(),
                    pendingWithdrawals: ds.loadDict(Dictionary.Keys.Uint(32), {
                        parse: (src) => src.loadCoins(),
                        serialize: (src, builder) => builder.storeCoins(src)
                    })
                },
                balance: state.balance
            };
        },
        staleTime: 1000 * 60 * 60,
        queryKey: Queries.StakingLiquid(pool.toString(), member.toString({ testOnly: network.isTestnet })),
    });
}