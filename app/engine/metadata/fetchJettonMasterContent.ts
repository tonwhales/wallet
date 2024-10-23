import axios from "axios";
import { Address } from "@ton/core";
import { z } from "zod";

const imagePreview = z.object({
    blurhash: z.string(),
    preview256: z.string()
});

const contentCodec = z.object({
    name: z.string().nullable(),
    description: z.string().nullish(),
    symbol: z.string().nullable(),
    decimals: z.union([z.number(), z.string()]).nullish(),
    originalImage: z.string().nullish(),
    image: imagePreview.nullable(),
});

const lpAssetCodec = z.discriminatedUnion('type', [
    z.object({ type: z.literal('jetton'), metadata: contentCodec, address: z.string() }),
    z.object({ type: z.literal('native') })
]);

const lpDataCodec = z.object({
    assets: z.array(lpAssetCodec).length(2).optional(),
    pool: z.union([z.literal('dedust'), z.literal('ston-fi')]).optional(),
});

const masterContentCodec = z.intersection(
    contentCodec,
    lpDataCodec.optional(),
);

export type LPAssetMetadata = z.infer<typeof lpAssetCodec>;
export type JettonMasterState = z.infer<typeof masterContentCodec> & { decimals: number | null };

export async function fetchJettonMasterContent(address: Address, isTestnet: boolean): Promise<JettonMasterState | null> {
    const res = await axios.get(
        `https://connect.tonhubapi.com/jettons/metadata?address=${address.toString({ testOnly: isTestnet })}`,
        { timeout: 5000 }
    );

    if (res.status === 200) {
        const parsed = masterContentCodec.safeParse(res.data);
        if (!parsed.success) {
            console.warn('[Parsing master content failed]', {
                address: address.toString({ testOnly: isTestnet }),
                error: parsed.error,
                data: JSON.stringify(res.data),
            });
            return null;
        }

        if (typeof parsed.data.decimals === 'string') {
            parsed.data.decimals = parseInt(parsed.data.decimals);
        }

        return parsed.data as JettonMasterState;
    }

    return null;
}
