import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "..";
import { Queries } from "../../queries";
import { BrowserListing, fetchBrowserListings } from "../../api/fetchBrowserListings";
import { z } from 'zod';

const categoryCodec = z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    weight: z.number().optional()
});

export type BrowserListingCategory = z.infer<typeof categoryCodec>;

export function useBrowserListings() {
    const { isTestnet } = useNetwork();
    return useQuery({
        queryKey: Queries.BrowserListings(isTestnet ? 'testnet' : 'mainnet'),
        queryFn: async () => {
            let res = await fetchBrowserListings();

            if (!isTestnet) {
                res = res.filter(b => b.is_test);
            }

            const mapped = res.map((b) => {
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
                    console.warn('useBrowserListings', error);
                    return { ...b, category: null };
                }
            });

            console.log('useBrowserListings', mapped.length);

            return mapped;
        },
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 1000, // 1 hour
        // staleTime: 1000 * 60 * 60, // 1 hour
    });
}

