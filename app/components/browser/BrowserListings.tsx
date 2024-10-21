import { memo, useMemo } from "react";
import { BrowserListingsWithCategory, useBrowserListings } from "../../engine/hooks/banners/useBrowserListings";
import { t } from "../../i18n/t";
import { BrowserBanners } from "./BrowserBanners";
import { BrowserCategories } from "./BrowserCategories";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { NativeScrollEvent, NativeSyntheticEvent, Platform } from "react-native";
import Animated from "react-native-reanimated";
import { useHoldersBrowserListings } from "../../engine/hooks/banners/useHoldersBrowserListings";

export type BrowserBannerItem = BrowserListingsWithCategory & { banner_type: 'bannerItem', isHolders?: boolean };
export type BrowserListingItem = BrowserListingsWithCategory & { banner_type: 'listItem', isHolders?: boolean };
export type ListingsCategory = {
    id: string;
    title: string;
    description?: string;
    weight: number;
    listings: BrowserListingItem[];
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

export const BrowserListings = memo(({
    listings,
    onScroll
}: {
    listings: BrowserListingsWithCategory[],
    onScroll?: ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
}) => {
    const holdersBrowserListings = useHoldersBrowserListings() || [];
    const bottomBarHeight = useBottomTabBarHeight();
    const { banners, list } = useMemo(() => {
        let banners: BrowserBannerItem[] = [];
        const list = new Map<string, ListingsCategory>();

        for (const l of listings) {
            if (l.banner_type === 'bannerItem') {
                banners.push(l as BrowserBannerItem);
            } else if (l.banner_type === 'listItem') {
                const category = l.category;

                if (!category) {
                    let others = list.get('others');

                    if (others) {
                        others.listings.push(l as BrowserListingItem);
                    } else {
                        others = { ...initOthersCategory };
                        others.listings.push(l as BrowserListingItem);
                        list.set('others', others);
                    }
                    continue;
                }

                const existing = list.get(category?.id ?? '');
                if (existing) {
                    existing.listings.push(l as BrowserListingItem);
                } else {
                    const title = supportedCategories.includes(category.id)
                        ? t(`browser.listings.categories.${category.id as SupportedCategory}`)
                        : category.title;

                    if (!title) {
                        continue;
                    }

                    let weight = undefined;
                    if (typeof category.weight === 'string') {
                        try {
                            weight = Number(category.weight);
                        } catch { }
                    }

                    list.set(
                        category.id,
                        {
                            id: category.id,
                            title: title,
                            description: category.description,
                            weight: weight || 0,
                            listings: [l as BrowserListingItem]
                        }
                    );
                }
            }
        }

        for (const l of holdersBrowserListings.filter((b) => b.banner_type === 'listItem')) {
            const category = l.category;

            if (!category) {
                let others = list.get('others');

                if (others) {
                    others.listings.push({ ...l, isHolders: true } as BrowserListingItem);
                } else {
                    others = { ...initOthersCategory };
                    others.listings.push({ ...l, isHolders: true } as BrowserListingItem);
                    list.set('others', others);
                }
                continue;
            }

            const existing = list.get(category?.id ?? '');
            if (existing) {
                existing.listings.push({ ...l, isHolders: true } as BrowserListingItem);
            } else {
                const title = supportedCategories.includes(category.id)
                    ? t(`browser.listings.categories.${category.id as SupportedCategory}`)
                    : category.title;

                if (!title) {
                    continue;
                }

                let weight = undefined;
                if (typeof category.weight === 'string') {
                    try {
                        weight = Number(category.weight);
                    } catch { }
                }

                list.set(
                    category.id,
                    {
                        id: category.id,
                        title: title,
                        description: category.description,
                        weight: weight || 0,
                        listings: [{ ...l, isHolders: true } as BrowserListingItem]
                    }
                );
            }
        }

        banners = banners.sort((a, b) => {
            if (a.weight === b.weight) {
                return 0;
            }
            return (a.weight ?? 0) > (b.weight ?? 0) ? -1 : 1;
        });

        const holdersBanners = holdersBrowserListings.filter((b) => {
            return b.banner_type === 'bannerItem';
        }).map((b) => ({ ...b, isHolders: true }) as BrowserBannerItem);

        banners = [...(holdersBanners as BrowserBannerItem[]), ...banners];

        return { banners, list };

    }, [listings, holdersBrowserListings]);

    return (
        <Animated.ScrollView
            style={{ flexGrow: 1, flexShrink: 1 }}
            showsVerticalScrollIndicator={false}
            contentInset={{ top: 0.1, left: 0, bottom: 156, right: 0 }}
            contentOffset={{ y: -56, x: 0 }}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={Platform.select({
                android: { paddingBottom: 56 + 52 + 32 + bottomBarHeight },
                ios: { paddingBottom: 156 }
            })}
        >
            <BrowserBanners banners={banners} />
            <BrowserCategories list={list} />
        </Animated.ScrollView>
    );
});