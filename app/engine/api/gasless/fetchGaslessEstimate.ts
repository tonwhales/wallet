import { Address } from "@ton/core";
import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";

export type GaslessEstimateParams = {
    wallet_address: string,
    wallet_public_key: string,
    messages: {
        boc: string
    }[]
}

const gaslessMessageScheme = z.object({
    address: z.string(),
    amount: z.string(),
    payload: z.string().nullish(),
    stateInit: z.string().nullish()
});

const gaslessEstimateScheme = z.object({
    relay_address: z.string(),
    commission: z.string(),
    from: z.string(),
    valid_until: z.number(),
    messages: z.array(gaslessMessageScheme)
});
const gaslessEstimateSuccess = z.intersection(z.object({ ok: z.literal(true) }), gaslessEstimateScheme);
const gaslessEstimateError = z.object({ ok: z.literal(false), error: z.string() });
const gaslessEstimateResponse = z.union([gaslessEstimateSuccess, gaslessEstimateError]);

export type GaslessMessage = z.infer<typeof gaslessMessageScheme>;
export type GaslessEstimate = z.infer<typeof gaslessEstimateResponse>;
export type GaslessEstimateSuccess = z.infer<typeof gaslessEstimateSuccess>;

export async function fetchGaslessEstimate(master: Address | string, isTestnet: boolean, body: GaslessEstimateParams): Promise<GaslessEstimate> {
    const masterString = typeof master === 'string' ? master : master.toRawString();
    const endpoint = `${whalesConnectEndpoint}/gasless/${isTestnet ? 'testnet' : 'mainnet'}`;
    const url = `${endpoint}/estimate`;

    const res = await axios.post(url, { data: body, master: masterString }, { method: 'POST' });

    if (!res.data) {
        throw new Error('Failed to fetch gasless estimate');
    }

    const parsed = gaslessEstimateResponse.safeParse(res.data);

    if (!parsed.success) {
        throw new Error('Invalid gasless estimate response');
    }

    return parsed.data;
}