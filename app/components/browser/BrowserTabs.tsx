import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NativeScrollEvent, Platform, View } from "react-native";
import { PressableChip } from "../PressableChip";
import { t } from "../../i18n/t";
import { useTheme } from "../../engine/hooks";
import { BrowserExtensions } from "./BrowserExtensions";
import { BrowserListings } from "./BrowserListings";
import { BrowserConnections } from "./BrowserConnections";
import { BrowserListingsWithCategory, useBrowserListings } from "../../engine/hooks/banners/useBrowserListings";
import { ScrollView } from "react-native-gesture-handler";
import { NativeSyntheticEvent } from "react-native";
import { getCountryCodes } from "../../utils/isNeocryptoAvailable";

function filterByStoreGeoListings(codes: { countryCode: string, storeFrontCode: string | null },) {
    return (listing: BrowserListingsWithCategory) => {
        const { countryCode, storeFrontCode } = codes;

        let excludedRegions = [], includedRegions: string[] | null = null;
        try {
            excludedRegions = JSON.parse(listing.regions_to_exclude || '[]');
        } catch {
            // Do nothing
        }

        if (!!listing.regions_to_include) {
            try {
                includedRegions = JSON.parse(listing.regions_to_include);
            } catch {
                // Do nothing
            }
        }

        // check for excluded regions
        const excludedByStore = !!storeFrontCode && excludedRegions.includes(storeFrontCode);
        const excludedByCountry = !!countryCode && excludedRegions.includes(countryCode);

        if (excludedByStore || excludedByCountry) {
            return false;
        }

        if (includedRegions === null) {
            return true;
        }

        // check for included regions
        const includedByStore = !!storeFrontCode ? includedRegions.includes(storeFrontCode) : false;
        const includedByCountry = !!countryCode ? includedRegions.includes(countryCode) : false;

        if (!includedByStore && !includedByCountry) {
            return false;
        }

        return true;
    }
}

export const BrowserTabs = memo(({ onScroll }: { onScroll?: ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) }) => {
    const theme = useTheme();
    const browserListings = useBrowserListings().data || [];
    const regionCodes = getCountryCodes();
    const filterByCodes = useCallback(filterByStoreGeoListings(regionCodes), [regionCodes]);
    const listings = browserListings.filter(filterByCodes);
    const hasListings = !!listings && listings.length > 0;
    const tabRef = useRef(hasListings ? 0 : 1);
    const [tab, setTab] = useState(tabRef.current);

    const chipsScrollRef = useRef<ScrollView>(null);

    const tabComponent = useMemo(() => {
        if (tab === 0) {
            return <BrowserListings onScroll={onScroll} listings={listings} />;
        }

        if (tab === 1) {
            return <BrowserExtensions onScroll={onScroll} />;
        }

        return <BrowserConnections onScroll={onScroll} />;
    }, [tab, listings, onScroll]);

    const onSetTab = useCallback((index: number) => {
        tabRef.current = index;
        setTab(index);
    }, []);

    useEffect(() => {
        if (tabRef.current === 1 && !hasListings) {
            onSetTab(1);
        } else if (tabRef.current === 1 && hasListings) {
            onSetTab(0);
        }
    }, [hasListings]);

    useEffect(() => {
        if (chipsScrollRef.current) {
            if (tab === 0) {
                chipsScrollRef.current.scrollTo({ x: -24, y: 0, animated: true });
            } else if (tab === 2) {
                chipsScrollRef.current.scrollToEnd({ animated: true });
            }
        }
    }, [tab]);

    return (
        <View>
            <ScrollView
                ref={chipsScrollRef}
                horizontal
                contentContainerStyle={[
                    { flexDirection: 'row', gap: 8, paddingVertical: 8 },
                    Platform.select({ android: { paddingHorizontal: 8 } })
                ]}
                contentInset={{ right: 24, left: 16 }}
                contentOffset={{ x: -24, y: 0 }}
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8 }}
            >
                {!!listings && listings.length > 0 && (
                    <PressableChip
                        onPress={() => onSetTab(0)}
                        style={[
                            { backgroundColor: tab === 0 ? theme.accent : theme.border },
                            Platform.select({ android: { marginLeft: 16 } })
                        ]}
                        textStyle={{ color: tab === 0 ? theme.white : theme.textPrimary, }}
                        text={t('browser.listings.title')}
                    />
                )}
                <PressableChip
                    onPress={() => onSetTab(1)}
                    style={[
                        { backgroundColor: tab === 1 ? theme.accent : theme.border },
                        (!listings || listings.length <= 0) && Platform.select({ android: { marginLeft: 16 } })
                    ]}
                    textStyle={{ color: tab === 1 ? theme.white : theme.textPrimary, }}
                    text={t('connections.extensions')}
                />
                <PressableChip
                    onPress={() => onSetTab(2)}
                    style={{ backgroundColor: tab === 2 ? theme.accent : theme.border }}
                    textStyle={{ color: tab === 2 ? theme.white : theme.textPrimary, }}
                    text={t('connections.connections')}
                />
            </ScrollView>
            {tabComponent}
        </View>
    );
});