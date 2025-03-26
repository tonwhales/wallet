import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../clients";

const extraCurrencyPreviewCodec = z.object({
    id: z.number(),
    symbol: z.string(),
    decimals: z.number(),
    image: z.string().optional(),
});

const extraCurrencyHintCodec = z.object({
    amount: z.string(),
    preview: extraCurrencyPreviewCodec,
});

export type ExtraCurrencyHint = z.infer<typeof extraCurrencyHintCodec>;

export async function fetchExtraCurrencyHints(address: string, isTestnet?: boolean): Promise<ExtraCurrencyHint[]> {
    const uri = `${whalesConnectEndpoint}/hints/extra/${encodeURIComponent(address)}`;
    const url = new URL(uri);
    if (isTestnet) {
        url.searchParams.append('isTestnet', 'true');
    }

    const res = await axios.get(url.toString());
    const parsed = z.array(extraCurrencyHintCodec).safeParse(res.data);

    if (!parsed.success) {
        console.warn('[Parsing hints failed]', parsed.error);
        throw Error('Invalid hints');
    }

    return parsed.data;
}