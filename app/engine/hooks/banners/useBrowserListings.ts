import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "..";
import { Queries } from "../../queries";
import { BrowserListing, fetchBrowserListings } from "../../api/fetchBrowserListings";
import { z } from 'zod';

export const categoryCodec = z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    weight: z.union([z.number(), z.string()]).optional()
});

export type BrowserListingCategory = z.infer<typeof categoryCodec>;
export type BrowserListingsWithCategory = Omit<BrowserListing, 'category'> & { category?: BrowserListingCategory | null };

export function useBrowserListings() {
    const { isTestnet } = useNetwork();
    return useQuery({
        queryKey: Queries.BrowserListings(isTestnet ? 'testnet' : 'mainnet'),
        queryFn: async () => {
            let res = await fetchBrowserListings();

            if (!isTestnet) {
                res = res.filter(b => !b.is_test);
            }

            const mapped = res
                .filter((b) => {
                    // Filter out disabled banners
                    return b.enabled
                        && b.start_date < Date.now()
                        && b.expiration_date > Date.now();
                }).map((b) => {
                    // Parse category
                    if (!b.category) {
                        return b;
                    }

                    try {
                        const categoryParsed = categoryCodec.safeParse(JSON.parse(b.category));

                        if (!categoryParsed.success) {
                            return { ...b, category: null };
                        }

                        return {
                            ...b,
                            category: categoryParsed.data
                        }
                    } catch (error) {
                        return { ...b, category: null };
                    }
                });

            return mapped as BrowserListingsWithCategory[];
        },
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

