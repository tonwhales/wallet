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

// {
//     relay_address*	string($address)example: 0:da6b1b6663a0e4d18cc8574ccd9db5296e367dd9324706f3bbd9eb1cd2caf0bf
//     commission*	stringexample: 1000000
//     Commission for the transaction. In nanocoins.

//     from*	string($address)example: 0:da6b1b6663a0e4d18cc8574ccd9db5296e367dd9324706f3bbd9eb1cd2caf0bf
//     valid_until*	integer($int64)example: 1717397217
//     messages*	
//     [
//     SignRawMessage
//     {
//     address*	string($address)example: 0:da6b1b6663a0e4d18cc8574ccd9db5296e367dd9324706f3bbd9eb1cd2caf0bf
//     amount*	string
//     Number of nanocoins to send. Decimal string.

//     payload	string($cell)
//     Raw one-cell BoC encoded in hex.

//     stateInit	string($cell)
//     Raw once-cell BoC encoded in hex.

//     }]
//     }

const a = {
    "commission": "118677",
    "from": "0:481b31be07777934fe22c299767426ed4f81bef1050bf79d9d22f45ff9476ba6",
    "messages": [
        { "address": "0:21e6853bdf83964f1fec7a9d17e8c1b5e1bfc16a14fb28221e85cf3cfc6b7783", "amount": "50000000", "payload": "b5ee9c720101010100560000a80f8a7ea517f2019a0aa0ea00301cf95801bf7ab7d092ffb8193f97bf8ced0c9081bbf15ac847adaacafb361d04e1ad91590037ef56fa125ff70327f2f7f19da19210377e2b5908f5b5595f66c3a09c35b22b0202" },
        { "address": "0:21e6853bdf83964f1fec7a9d17e8c1b5e1bfc16a14fb28221e85cf3cfc6b7783", "amount": "57683346", "payload": "b5ee9c720101020100590001a80f8a7ea5000000000000000030f4240800c4e30a550eb1fa5cf55feb308814da2e69ed03dfe3b98500b7b804cec30fd40f0037ef56fa125ff70327f2f7f19da19210377e2b5908f5b5595f66c3a09c35b22b0203010000" }
    ],
    "relay_address": "0:dfbd5be8497fdc0c9fcbdfc676864840ddf8ad6423d6d5657d9b0e8270d6c8ac",
    "valid_until": 1725443608
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
    const endpoint = isTestnet ? "https://testnet.tonapi.io" : "https://tonapi.io";
    const url = `${endpoint}/v2/gasless/estimate/${masterString}`;

    const res = await axios.post(url, body, { method: 'POST' });

    if (!res.data) {
        throw new Error('Failed to fetch gasless estimate');
    }

    const parsed = gaslessEstimateScheme.safeParse(res.data);

    if (!parsed.success) {
        throw new Error('Invalid gasless estimate response');
    }

    return parsed.data;
}