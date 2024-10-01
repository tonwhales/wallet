import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";

const gaslessConfigScheme = z.object({
    gas_jettons: z.array(z.object({
        master_id: z.string()
    })),
    relay_address: z.string()
});

export type GaslessConfig = z.infer<typeof gaslessConfigScheme>;

export async function fetchGaslessConfig(isTestnet: boolean): Promise<GaslessConfig> {
    const endpoint = `${whalesConnectEndpoint}/gasless/${isTestnet ? 'testnet' : 'mainnet'}`;
    const url = `${endpoint}/config`;
    const res = await axios.get(url, { method: 'GET' });

    if (!res.data) {
        throw new Error('Failed to fetch gasless config');
    }

    const parsed = gaslessConfigScheme.safeParse(res.data);

    if (!parsed.success) {
        throw new Error('Invalid gasless config response');
    }

    return parsed.data;
}