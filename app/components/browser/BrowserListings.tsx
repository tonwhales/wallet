import { memo, useMemo } from "react";
import { BrowserListing } from "../../engine/api/fetchBrowserListings";
import { BrowserListingCategory } from "../../engine/hooks/banners/useBrowserListings";
import { t } from "../../i18n/t";
import { View } from "react-native";
import { BrowserBanners } from "./BrowserBanners";

type Listing = Omit<BrowserListing, 'category'> & { category: BrowserListingCategory }
export type BrowserBannerItem = Listing & { banner_type: 'banner' };
export type BrowserListingItem = Listing & { banner_type: 'listing' };

type ListingsCategory = {
    id: string;
    title: string;
    description?: string;
    weight: number;
    listings: Listing[];
};

const initOthersCategory = {
    id: 'others',
    title: t('browser.listings.categories.other'),
    description: '',
    weight: -1,
    listings: []
};

const supportedCategories = ['other', 'exchange', 'defi', 'nft', 'games', 'social', 'utils', 'services'];
type SupportedCategory = 'other' | 'exchange' | 'defi' | 'nft' | 'games' | 'social' | 'utils' | 'services';

export const BrowserListings = memo(({ listings }: { listings: Listing[] }) => {
    console.log('BrowserListings', listings.length);
    const { banners, list } = useMemo(() => {
        const banners: BrowserBannerItem[] = [];
        const list = new Map<string, ListingsCategory>();

        for (const l of listings) {
            console.log('BrowserListings', l.title, l.banner_type);
            if (l.banner_type === 'banner') {
                banners.push(l as BrowserBannerItem);
            } else if (l.banner_type === 'listing') {
                const category = l.category;

                if (!category) {
                    let others = list.get('others');

                    if (others) {
                        others.listings.push(l);
                    } else {
                        others = { ...initOthersCategory };
                        others.listings.push(l);
                        list.set('others', others);
                    }
                }

                const existing = list.get(category.id);
                if (existing) {
                    existing.listings.push(l);
                } else {
                    const title = supportedCategories.includes(category.id)
                        ? t(`browser.listings.categories.${category.id as SupportedCategory}`)
                        : category.title;

                    // TODO: add translation for category.description

                    if (!title) {
                        continue;
                    }

                    list.set(
                        category.id,
                        {
                            id: category.id,
                            title: title,
                            description: category.description,
                            weight: category.weight || 0,
                            listings: [l]
                        }
                    );
                }
            }
        }

        return { banners, list };

    }, [listings]);

    console.log('BrowserListings', banners.length, list.size);

    return (
        <View>
            <BrowserBanners banners={banners} />
        </View>
    );
});