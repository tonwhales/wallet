import axios from "axios";
import { z } from "zod";

const browserListingCodec = z.object({
    id: z.number(),
    weight: z.number().optional(),
    image_url: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    banner_type: z.string().nullable().optional(),
    product_url: z.string(),
    start_date: z.number(),
    expiration_date: z.number(),
    regions_to_exclude: z.string().nullable().optional(),
    enabled: z.boolean(),
    category: z.string().nullable().optional(),
    is_test: z.boolean().nullable().optional()
});

const browserListingsResponseCodec = z.object({ banners: z.array(browserListingCodec) });

export type BrowserListing = z.infer<typeof browserListingCodec>;

export async function fetchBrowserListings(): Promise<BrowserListing[]>{
    console.log('fetchBrowserListings');
    // const response = await axios.get('https://connect.tonhubapi.com/tonhub/banners');
    const response = await axios.get('http://10.100.102.3:3000/tonhub/banners');

    console.log('fetchBrowserListings', response.data);

    if (response.status !== 200) {
        return [];
    }

    const parsed = browserListingsResponseCodec.safeParse(response.data);

    if (parsed.success) {
        return parsed.data.banners;
    } else {
        console.warn('fetchBrowserListings', parsed.error);
        return [];
    }
}