import { Address } from "@ton/core";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";
import axios from "axios";
import { useEthena, useNetwork } from "..";

const liquidUsdeStakingMemberScheme = z.object({
    balance: z.string(),
    owner: z.string(),
    minter: z.string(),
    timeLocked: z.object({
        balance: z.string(),
        limit: z.string(),
    }).nullish(),
}).nullish();

export type LiquidUSDeStakingMember = z.infer<typeof liquidUsdeStakingMemberScheme>;

async function fetchLiquidUSDeStakingMember(isTestnet: boolean, account: Address) {
    const url = `${whalesConnectEndpoint}/usde/staking/member/liquid/info`;
    const res = await axios.post(url, {
        isTestnet,
        address: account.toString({ testOnly: isTestnet })
    });

    const parsed = liquidUsdeStakingMemberScheme.safeParse(res.data);

    if (!parsed.success) {
        throw new Error('Invalid fetchLiquidUSDeStakingMemberQueryFn response');
    }

    return parsed.data;
}

export function useLiquidUSDeStakingMember(account: Address | null | undefined) {
    const { isTestnet } = useNetwork();
    const { tsMinter } = useEthena();

    const query = useQuery<LiquidUSDeStakingMember>({
        queryFn: async () => {
            try {
                return await fetchLiquidUSDeStakingMember(isTestnet, account!);
            } catch {
                return null;
            }
        },
        refetchOnMount: true,
        queryKey: Queries.StakingLiquidUSDeMember(
            tsMinter.toString({ testOnly: isTestnet }),
            account!.toString({ testOnly: isTestnet })
        ),
        staleTime: 1000 * 6,
        enabled: !!account,
        refetchInterval: 1000 * 30
    });

    if (query.data) {
        return {
            balance: BigInt(query.data.balance),
            owner: Address.parse(query.data.owner),
            minter: Address.parse(query.data.minter),
            timeLocked: query.data.timeLocked ? {
                balance: BigInt(query.data.timeLocked.balance),
                limit: BigInt(query.data.timeLocked.limit),
            } : null,
        }
    }

    return null;
}