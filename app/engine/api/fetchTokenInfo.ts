import axios from "axios";
import { whalesConnectEndpoint } from "../clients";
import { z } from "zod";

// export type TokenDescriptionLink = {
//     type: 'link'
//     title: string;
//     url: string;
// }

// export type TokenDescriptionText = {
//     type: 'text'
//     title: string;
//     value: string;
// }

// export type TokenDescription = {
//     title: string,
//     description: string,
//     items: (TokenDescriptionLink | TokenDescriptionText)[];
// }

// export type CMCTokenQuote = {
//     price: number;
//     volume_24h: number;
//     volume_change_24h: number;
//     volume_24h_reported?: number;
//     volume_7d?: number;
//     volume_7d_reported?: number;
//     volume_30d?: number;
//     volume_30d_reported?: number;
//     market_cap: number;
//     market_cap_dominance: number;
//     fully_diluted_market_cap: number;
//     percent_change_1h: number;
//     percent_change_24h: number;
//     percent_change_7d: number;
//     percent_change_30d: number;
//     last_updated: Date;
// };

// export type CMCTokenPlatform = {
//     id: number;
//     name: string;
//     symbol: string;
//     slug: string;
//     token_address: string;
// };

// export type CMCTokenInfo = {
//     _id: number; // CoinMarketCap ID
//     name: string;
//     symbol: string;
//     slug: string;
//     is_active: number;
//     is_fiat: number;
//     cmc_rank: number;
//     num_market_pairs: number;
//     circulating_supply: number;
//     total_supply: number;
//     market_cap_by_total_supply?: number;
//     max_supply: number | null;
//     date_added: Date;
//     tags: string[];
//     platform: CMCTokenPlatform | null;
//     last_updated: Date;
//     self_reported_circulating_supply?: number;
//     self_reported_market_cap?: number;
//     minted_market_cap?: number;
//     quote: Record<string, CMCTokenQuote>;
// };

const tokenInfoDescriptionItemSchema = z.union([z.object({
    type: z.literal('link'),
    title: z.string(),
    url: z.string(),
}), z.object({
    type: z.literal('text'),
    title: z.string(),
    value: z.string(),
})]);

const tokenInfoDescriptionSchema = z.object({
    title: z.string(),
    description: z.string(),
    items: z.array(tokenInfoDescriptionItemSchema),
});

const tokenCMCQuoteSchema = z.object({
    price: z.number(),
    volume_24h: z.number(),
    volume_change_24h: z.number(),
    volume_24h_reported: z.number().nullish(),
    volume_7d: z.number().nullish(),
    volume_7d_reported: z.number().nullish(),
    volume_30d: z.number().nullish(),
    volume_30d_reported: z.number().nullish(),
    market_cap: z.number(),
    market_cap_dominance: z.number(),
    fully_diluted_market_cap: z.number(),
    percent_change_1h: z.number(),
    percent_change_24h: z.number(),
    percent_change_7d: z.number(),
    percent_change_30d: z.number(),
    last_updated: z.coerce.date(),
});

const tokenCMCPlatformSchema = z.object({
    id: z.number(),
    name: z.string(),
    symbol: z.string(),
    slug: z.string(),
    token_address: z.string(),
});

const tokenCMCTagSchema = z.object({
    slug: z.string(),
    name: z.string(),
    category: z.string(),
});

const tokenCMCInfoSchema = z.object({
    _id: z.number(),
    name: z.string(),
    symbol: z.string(),
    slug: z.string(),
    is_active: z.number(),
    is_fiat: z.number(),
    cmc_rank: z.number(),
    num_market_pairs: z.number(),
    circulating_supply: z.number(),
    total_supply: z.number(),
    market_cap_by_total_supply: z.number().nullish(),
    max_supply: z.number().nullish(),
    date_added: z.coerce.date(),
    tags: z.array(tokenCMCTagSchema),
    platform: tokenCMCPlatformSchema.nullish(),
    last_updated: z.coerce.date(),
    self_reported_circulating_supply: z.number().nullish(),
    self_reported_market_cap: z.number().nullish(),
    minted_market_cap: z.number().optional(),
    quote: z.record(tokenCMCQuoteSchema),
});

const tokenInfoSchema = z.object({
    description: tokenInfoDescriptionSchema.nullish(),
    data: tokenCMCInfoSchema,
});

export type TokenInfo = z.infer<typeof tokenInfoSchema>;

export async function fetchTokenInfo(id: string): Promise<TokenInfo | null> {
    const body = { id };
    const res = await axios.post(`${whalesConnectEndpoint}/token/info`, body);
    const result = tokenInfoSchema.safeParse(res.data);

    if (!result.success) {
        console.error('Token info validation error:', result.error);
        return null;
    }

    return result.data;
}