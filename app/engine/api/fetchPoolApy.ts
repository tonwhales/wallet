import axios from "axios";
import { z } from 'zod';
import { stakingIndexerUrl } from "./fetchStakingNominator";

const poolApyResCodec = z.array(z.object({
    poolApy: z.string(),
    globalApy: z.string(),
    time: z.string()
}));

export type PoolApy = z.infer<typeof poolApyResCodec>;

export async function fetchPoolApy(address: string) {
    const res = (await axios.post(
        `${stakingIndexerUrl}/indexer/pool/apy`,
        { address, fixedPeriod: 'week' }
    )).data;

    const parsed = poolApyResCodec.safeParse(res);

    if (!parsed.success) {
        console.warn(`Failed to parse pool apy response: `, res);
        throw Error('Invalid apy');
    }

    return parsed.data as PoolApy;
}