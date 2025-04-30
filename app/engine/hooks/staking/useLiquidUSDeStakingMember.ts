import { Address } from "@ton/core";
import { useNetwork } from "../network";
import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";
import axios from "axios";
import { gettsUSDeMinter } from "../../../secure/KnownWallets";

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

function fetchLiquidUSDeStakingMemberQueryFn(isTestnet: boolean, account: Address) {
    return async () => {
        const url = `${whalesConnectEndpoint}/usde/staking/member/liquid/info`;
        console.log('url', url, isTestnet, account.toString({ testOnly: isTestnet }));
        const res = await axios.post(url, {
            isTestnet,
            address: account.toString({ testOnly: isTestnet })
        });

        const parsed = liquidUsdeStakingMemberScheme.safeParse(res.data);

        if (!parsed.success) {
            throw new Error('Invalid fetchLiquidUSDeStakingMemberQueryFn response');
        }

        console.log('fetchLiquidUSDeStakingMemberQueryFn', parsed.data);

        return parsed.data;
    };
}

export function useLiquidUSDeStakingMember(account: Address | null | undefined) {
    const { isTestnet } = useNetwork();
    const pool = gettsUSDeMinter(isTestnet);

    const query = useQuery<LiquidUSDeStakingMember>({
        queryFn: fetchLiquidUSDeStakingMemberQueryFn(isTestnet, account!),
        refetchOnMount: true,
        queryKey: Queries.StakingLiquidMember(
            pool.toString({ testOnly: isTestnet }),
            account!.toString({ testOnly: isTestnet })
        ),
        staleTime: 1000 * 30,
        enabled: !!account
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