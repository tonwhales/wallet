import axios from "axios";
import { z } from 'zod';

const poolApyResCodec = z.array(z.object({
    poolApy: z.string(),
    globalApy: z.string(),
    time: z.string()
}));

export type PoolApy = z.infer<typeof poolApyResCodec>;

export async function fetchPoolApy(address: string) {
    const res = (await axios.post(
        `https://staking-indexer-shci7.ondigitalocean.app/indexer/pool/apy`,
        { address, fixedPeriod: 'week' }
    )).data;

    console.log(`[Pool apy] for ${address} response: `, res);

    const parsed = poolApyResCodec.safeParse(res);

    if (!parsed.success) {
        console.warn(`Failed to parse pool apy response: `, res);
        throw Error('Invalid apy');
    }

    return parsed.data as PoolApy;
}