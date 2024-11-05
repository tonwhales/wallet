import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../clients";

const jettonRatesCodec = z.object({
    prices: z.record(z.number()).optional(),
    diff24h: z.record(z.string()).optional(),
    diff7d: z.record(z.string()).optional(),
    diff30d: z.record(z.string()).optional()
});

const jettonVerificationTypeCodec = z.union([
    z.literal('whitelist'),
    z.literal('blacklist'),
    z.literal('none')
]);

const jettonPreviewCodec = z.object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
    image: z.string(),
    verification: jettonVerificationTypeCodec
})

const walletAddressCodec = z.object({
    address: z.string(),
    name: z.string().optional(),
    isScam: z.boolean(),
    icon: z.string().optional(),
    isWallet: z.boolean()
});

const jettonBalanceCodec = z.object({
    balance: z.string(),
    price: jettonRatesCodec.optional(),
    walletAddress: walletAddressCodec,
    jetton: jettonPreviewCodec,
    extensions: z.array(z.string()).optional()
});

const hintsFullCodec = z.object({
    hints: z.array(jettonBalanceCodec)
});

export type JettonBalance = z.infer<typeof jettonBalanceCodec>;
export type JettonPreview = z.infer<typeof jettonPreviewCodec>;
export type WalletAddress = z.infer<typeof walletAddressCodec>;

export async function fetchHintsFull(address: string, isTestnet?: boolean): Promise<JettonBalance[]> {
    const uri = `${whalesConnectEndpoint}/hints/full/${encodeURIComponent(address)}`;
    const url = new URL(uri);
    if (isTestnet) {
        url.searchParams.append('isTestnet', 'true');
    }

    const res = await axios.get(url.toString());
    const parsed = hintsFullCodec.safeParse(res.data);

    if (!parsed.success) {
        console.warn('[Parsing hints failed]', parsed.error);
        throw Error('Invalid hints');
    }

    return parsed.data.hints;
}