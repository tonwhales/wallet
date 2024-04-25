import * as React from 'react';
import { useCallback } from 'react';
import { Pressable, View, Image } from 'react-native';
import { fragment } from '../../fragment';
import { t } from '../../i18n/t';
import { resolveUrl } from '../../utils/resolveUrl';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useLinkNavigator } from '../../useLinkNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { TabHeader } from '../../components/topbar/TabHeader';
import { useNetwork, useTheme } from '../../engine/hooks';
import { setStatusBarStyle } from 'expo-status-bar';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useDimensions } from '@react-native-community/hooks';
import { holdersUrl as resolveHoldersUrl } from '../../engine/api/holders/fetchAccountState';

type Item = {
    key: string;
    name: string;
    url: string;
    date: number;
}

type GroupedItems = {
    name: string;
    url: string;
    items: Item[];
};

function groupItems(items: Item[]): GroupedItems[] {
    let sorted = [...items].sort((a, b) => b.date - a.date);
    let groups: GroupedItems[] = [];
    for (let s of sorted) {
        let g = groups.find((v) => v.url.toLowerCase() === s.url.toLowerCase());
        if (g) {
            g.items.push(s);
        } else {
            groups.push({
                name: s.name, url: s.url,
                items: [s]
            });
        }
    }
    return groups;
}

const EmptyIllustrations = {
    dark: require('@assets/empty-connections-dark.webp'),
    light: require('@assets/empty-connections.webp')
}

export const BrowserFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const bottomBarHeight = useBottomTabBarHeight();
    const dimensions = useDimensions();
    const holdersUrl = resolveHoldersUrl(network.isTestnet);

    const [installedExtensions,] = useExtensions();
    const [inastalledConnectApps,] = useTonConnectExtensions();

    const extensions = Object.entries(installedExtensions.installed).map(([key, ext]) => {
        const appData = getCachedAppData(ext.url);
        return { ...ext, key, title: appData?.title || ext.title || ext.url }
    });
    
    const tonconnectApps = Object
        .entries(inastalledConnectApps)
        .map(([key, ext]) => ({ ...ext, key }))
        .filter((v) => v.url !== holdersUrl);

    const removeExtension = useRemoveExtension();
    const disconnectConnect = useDisconnectApp();

    const linkNavigator = useLinkNavigator(network.isTestnet);

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src, network.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch {
            // Ignore
        }
    };

    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);

    useFocusEffect(useCallback(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    }, [theme.style]));

    return (
        <View style={{ flex: 1 }}>
            <TabHeader
                title={t('home.browser')}
                rightAction={
                    <Pressable
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                            backgroundColor: theme.surfaceOnBg,
                            height: 32, width: 32, justifyContent: 'center', alignItems: 'center',
                            borderRadius: 16
                        })}
                        onPress={openScanner}
                    >
                        <Image
                            source={require('@assets/ic-scan-main.png')}
                            style={{
                                height: 22,
                                width: 22,
                                tintColor: theme.iconNav
                            }}
                        />
                    </Pressable>
                }
                style={{ marginBottom: 8 }}
            />
            <BrowserSearch navigation={navigation} theme={theme} />
            <BrowserTabs />
        </View>
    );
});