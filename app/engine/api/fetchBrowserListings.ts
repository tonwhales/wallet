import axios from "axios";
import { z } from "zod";
import { whalesConnectEndpoint } from "../clients";

export const browserListingCodec = z.object({
    id: z.number(),
    weight: z.number().optional(),
    image_url: z.string().nullish(),
    icon_url: z.string().nullish(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    banner_type: z.string().nullish(),
    product_url: z.string(),
    start_date: z.number(),
    expiration_date: z.number(),
    regions_to_exclude: z.string().nullish(),
    regions_to_include: z.string().nullish(),
    enabled: z.boolean(),
    category: z.string().nullish(),
    is_test: z.boolean().nullish()
});

export const browserListingsResponseCodec = z.object({ banners: z.array(browserListingCodec) });

export type BrowserListing = z.infer<typeof browserListingCodec>;

export async function fetchBrowserListings(): Promise<BrowserListing[]>{
    const response = await axios.get(`${whalesConnectEndpoint}/tonhub/banners`);

    if (response.status !== 200) {
        return [];
    }

    const parsed = browserListingsResponseCodec.safeParse(response.data);

    if (parsed.success) {
        return parsed.data.banners;
    } else {
        return [];
    }
}