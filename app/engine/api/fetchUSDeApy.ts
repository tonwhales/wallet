import axios from "axios";
import { whalesConnectEndpoint } from "../clients";
import { z } from "zod";
const apyCodec = z.object({
    apy: z.union([z.string(), z.number()])
});

export type StakingAPY = {
    apy: number
};

export async function fetchUSDeApy(isTestnet: boolean) {
    const res = ((await axios.get(`${whalesConnectEndpoint}/usde/${isTestnet ? 'testnet' : 'mainnet'}/apy`, { method: 'GET' })).data);

    const parsed = apyCodec.safeParse(res);

    if (!parsed.success) {
        throw Error('Invalid apy');
    }

    return { apy: parseFloat(parsed.data.apy.toString()) } as StakingAPY;
}