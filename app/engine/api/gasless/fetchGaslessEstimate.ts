import { Address } from "@ton/core";
import axios from "axios";
import { z } from "zod";

export type GaslessEstimateParams = {
    wallet_address: string,
    wallet_public_key: string,
    messages: {
        boc: string
    }[]
}

const gaslessEstimateScheme = z.object({
    relay_address: z.string(),
    commission: z.string(),
    from: z.string(),
    valid_until: z.number(),
    messages: z.array(z.object({
        address: z.string(),
        amount: z.string(),
        payload: z.string().nullable().optional(),
        stateInit: z.string().nullable().optional()
    }))
});

export type GaslessEstimate = z.infer<typeof gaslessEstimateScheme>;

export async function fetchGaslessEstimate(master: Address | string, isTestnet: boolean, body: GaslessEstimateParams): Promise<GaslessEstimate> {
    const masterString = typeof master === 'string' ? master : master.toRawString();
    const endpoint = `https://connect.tonhubapi.com/gasless/${isTestnet ? 'testnet' : 'mainnet'}`;
    const url = `${endpoint}/estimate`;

    const res = await axios.post(url, { data: body, master: masterString }, { method: 'POST' });

    if (!res.data) {
        throw new Error('Failed to fetch gasless estimate');
    }

    const parsed = gaslessEstimateScheme.safeParse(res.data);

    if (!parsed.success) {
        throw new Error('Invalid gasless estimate response');
    }

    return parsed.data;
}