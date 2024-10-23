import axios from "axios";
import { z } from "zod";
import { browserListingCodec, browserListingsResponseCodec } from "./fetchBrowserListings";

export type BrowserListing = z.infer<typeof browserListingCodec>;

export async function fetchHoldersBrowserListings(): Promise<BrowserListing[]>{
    const response = await axios.get('https://connect.tonhubapi.com/tonhub/holders/banners');

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