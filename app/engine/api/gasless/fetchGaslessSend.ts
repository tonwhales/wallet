import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../../clients";

export type GasslessSendParams = {
    wallet_public_key: string,
    boc: string
}

const gaslessSendError = z.object({ ok: z.literal(false), error: z.string() });
const gaslessSendSuccess = z.object({ ok: z.literal(true) });
const gaslessSendResponse = z.union([gaslessSendError, gaslessSendSuccess]);

export type GaslessSendResponse = z.infer<typeof gaslessSendResponse>;

export enum GaslessSendError {
    TryLater = 'try-later',
    NotEnough = 'not-enough',
    Cooldown = 'cooldown'
}

export async function fetchGaslessSend(body: GasslessSendParams, isTestnet: boolean): Promise<GaslessSendResponse> {
    const endpoint = `${whalesConnectEndpoint}/gasless/${isTestnet ? 'testnet' : 'mainnet'}`;
    const url = `${endpoint}/send`;

    const res = await axios.post(url, body, { method: 'POST' });

    if (res.status !== 200) {
        throw new Error('Failed to fetch gasless send');
    }

    const parsed = gaslessSendResponse.safeParse(res.data);

    if (!parsed.success) {
        throw new Error('Invalid gasless send response');
    }

    return parsed.data;
}