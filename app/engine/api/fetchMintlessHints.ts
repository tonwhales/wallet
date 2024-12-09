import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../clients";

const mintlessJettonScheme = z.object({
    balance: z.string(),
    walletAddress: z.object({
        address: z.string(),
        name: z.string().optional().nullable(),
        icon: z.string().optional().nullable(),
        isScam: z.boolean(),
        isWallet: z.boolean()
    }),
    price: z.object({
        prices: z.record(z.number()).optional().nullable(),
        diff24h: z.record(z.string()).optional().nullable(),
        diff7d: z.record(z.string()).optional().nullable(),
        diff30d: z.record(z.string()).optional().nullable()
    }).optional().nullable(),
    jetton: z.object({
        address: z.string(),
        name: z.string(),
        symbol: z.string(),
        decimals: z.number(),
        image: z.string(),
        verification: z.string(),
        customPayloadApiUri: z.string().nullish()
    }),
    extensions: z.array(z.string()),
    lock: z.object({
        amount: z.string(),
        till: z.number()
    }).optional().nullable()
});
const mintlessJettonListScheme = z.array(mintlessJettonScheme);

export type MintlessJetton = z.infer<typeof mintlessJettonScheme>;

export async function fetchMintlessHints(address: string): Promise<MintlessJetton[]> {
    const url = `${whalesConnectEndpoint}/mintless/jettons/${encodeURIComponent(address)}`;
    const res = (await axios.get(url)).data;

    const parsed = mintlessJettonListScheme.safeParse(res);

    if (!parsed.success) {
        throw Error('Invalid mintless hints');
    }

    return parsed.data;
}