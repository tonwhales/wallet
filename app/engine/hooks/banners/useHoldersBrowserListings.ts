import { useQuery } from "@tanstack/react-query";
import { useNetwork, useSelectedAccount } from "..";
import { Queries } from "../../queries";
import { fetchHoldersBrowserListings } from "../../api/fetchHoldersBrowserListings";
import { BrowserListingsWithCategory, categoryCodec } from "./useBrowserListings";
import { useIsHoldersInvited } from "../holders/useIsHoldersInvited";

export function useHoldersBrowserListings() {
    const { isTestnet } = useNetwork();
    const selectedAccount = useSelectedAccount();
    const inviteCheck = useIsHoldersInvited(selectedAccount!.address, isTestnet);
    const query = useQuery({
        queryKey: Queries.HoldersBrowserListings(isTestnet ? 'testnet' : 'mainnet'),
        queryFn: async () => {
            let res = await fetchHoldersBrowserListings();

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
                    } catch {
                        return { ...b, category: null };
                    }
                });

            return mapped as BrowserListingsWithCategory[];
        },
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    if (!inviteCheck) {
        return [];
    }

    return query.data;
}

