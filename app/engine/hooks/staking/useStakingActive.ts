import { Address } from "@ton/core";
import { useSelectedAccount } from "../appstate";
import { useNetwork } from "../network";
import { useKnownPools } from "../../../utils/KnownPools";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";
import axios from "axios";
import { Queries } from "../../queries";

const stakingActiveSchema = z.record(
    z.object({
        balance: z.string(),
        pendingDeposit: z.string(),
        pendingWithdraw: z.string(),
        withdraw: z.string(),
    }),
);

async function fetchStakingActive(isTestnet: boolean, address: Address, pools: Address[]) {
    const url = `${whalesConnectEndpoint}/staking/member/info`;

    const res = await axios.post(url, {
        isTestnet,
        address: address.toString({ testOnly: isTestnet }),
        pools: pools.map(p => p.toString({ testOnly: isTestnet }))
    });

    const parsed = stakingActiveSchema.safeParse(res.data);

    if (!parsed.success) {
        throw new Error('Invalid response');
    }

    return parsed.data;
}

function safeParseBigInt(value: string) {
    try {
        return BigInt(value);
    } catch {
        return 0n;
    }
}

export function useStakingActive(address?: Address) {
    const selected = useSelectedAccount();
    const { isTestnet } = useNetwork();
    const knownPools = Object.keys(useKnownPools(isTestnet)).map((key) => Address.parse(key));
    const account = address ?? selected?.address;

    const query = useQuery({
        queryKey: Queries.StakingAccountInfo(account!.toString({ testOnly: isTestnet })),
        queryFn: async () => {
            return await fetchStakingActive(isTestnet, address ?? selected!.address, knownPools);
        },
        refetchOnMount: true,
        staleTime: 1000 * 30,
        enabled: !!account
    });

    if (!query.data) {
        return undefined;
    }

    const data: {
        [key: string]: {
            balance: bigint,
            pendingDeposit: bigint,
            pendingWithdraw: bigint,
            withdraw: bigint
        }
    } = {};

    for (const key in query.data) {
        data[key] = {
            balance: safeParseBigInt(query.data[key].balance),
            pendingDeposit: safeParseBigInt(query.data[key].pendingDeposit),
            pendingWithdraw: safeParseBigInt(query.data[key].pendingWithdraw),
            withdraw: safeParseBigInt(query.data[key].withdraw),
        }
    }

    return data;
}