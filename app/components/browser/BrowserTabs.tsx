import { memo, useEffect, useMemo, useState } from "react";
import { Platform, View } from "react-native";
import { PressableChip } from "../PressableChip";
import { t } from "../../i18n/t";
import { useTheme } from "../../engine/hooks";
import { BrowserExtensions } from "./BrowserExtensions";
import { BrowserListings } from "./BrowserListings";
import { BrowserConnections } from "./BrowserConnections";
import { useBrowserListings } from "../../engine/hooks/banners/useBrowserListings";
import { ScrollView } from "react-native-gesture-handler";

export const BrowserTabs = memo(() => {
    const theme = useTheme();
    const listings = useBrowserListings().data || [];
    const hasListings = !!listings && listings.length > 0;
    const [tab, setTab] = useState(hasListings ? 0 : 1);

    const tabComponent = useMemo(() => {
        if (tab === 0) {
            return <BrowserListings listings={listings} />;
        }

        if (tab === 1) {
            return <BrowserExtensions />;
        }

        return <BrowserConnections />;
    }, [tab, listings]);

    useEffect(() => {
        if (tab === 0 && !hasListings) {
            setTab(1);
        }
    }, [hasListings, tab]);

    return (
        <View>
            <ScrollView
                horizontal
                contentContainerStyle={[
                    { flexDirection: 'row', gap: 8, paddingVertical: 8 },
                    Platform.select({ android: { paddingHorizontal: 8 } })
                ]}
                contentInset={{ right: 24, left: 24 }}
                showsHorizontalScrollIndicator={false}
            >
                {!!listings && listings.length > 0 && (
                    <PressableChip
                        onPress={() => setTab(0)}
                        style={[
                            { backgroundColor: tab === 0 ? theme.accent : theme.border },
                            Platform.select({ android: { marginLeft: 16 } })
                        ]}
                        textStyle={{ color: tab === 0 ? theme.white : theme.textPrimary, }}
                        text={t('browser.listings.title')}
                    />
                )}
                <PressableChip
                    onPress={() => setTab(1)}
                    style={[
                        { backgroundColor: tab === 1 ? theme.accent : theme.border },
                        (!listings || listings.length <= 0) && Platform.select({ android: { marginLeft: 16 } })
                    ]}
                    textStyle={{ color: tab === 1 ? theme.white : theme.textPrimary, }}
                    text={t('connections.extensions')}
                />
                <PressableChip
                    onPress={() => setTab(2)}
                    style={{ backgroundColor: tab === 2 ? theme.accent : theme.border }}
                    textStyle={{ color: tab === 2 ? theme.white : theme.textPrimary, }}
                    text={t('connections.connections')}
                />
            </ScrollView>
            {tabComponent}
        </View>
    );
});