import axios from 'axios';
import * as React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, Text, View, useWindowDimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fragment } from '../../fragment';
import { t } from '../../i18n/t';
import { addPendingRevoke, getConnectionReferences, removeConnectionReference, removePendingRevoke } from "../../storage/appState";
import { backoff } from '../../utils/time';
import { useTrackScreen } from '../../analytics/mixpanel';
import LottieView from 'lottie-react-native';
import { resolveUrl } from '../../utils/resolveUrl';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useLinkNavigator } from '../../useLinkNavigator';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { TabHeader } from '../../components/topbar/TabHeader';
import { ConnectionButton } from '../../components/ConnectionButton';
import { useDisconnectApp, useExtensions, useNetwork, useRemoveExtension, useTheme, useTonConnectExtensions } from '../../engine/hooks';
import { getDomainKey } from '../../engine/state/domainKeys';
import { getCachedAppData } from '../../engine/getters/getAppData';
import { setStatusBarStyle } from 'expo-status-bar';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import Scanner from '@assets/ic-scanner-accent.svg';

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

export const ConnectionsFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const window = useWindowDimensions();
    const bottomBarHeight = useBottomTabBarHeight();

    const [installedExtensions,] = useExtensions();
    const [inastalledConnectApps,] = useTonConnectExtensions();

    const extensions = Object.entries(installedExtensions.installed).map(([key, ext]) => {
        const appData = getCachedAppData(ext.url);
        return { ...ext, key, title: appData?.title || ext.title || ext.url }
    });
    const tonconnectApps = Object.entries(inastalledConnectApps).map(([key, ext]) => ({ ...ext, key }));

    const removeExtension = useRemoveExtension();
    const disconnectConnect = useDisconnectApp();

    const linkNavigator = useLinkNavigator(network.isTestnet);

    const [isExtensions, setIsExtensions] = useState(true);
    let [apps, setApps] = useState(groupItems(getConnectionReferences()));

    const openExtension = useCallback((url: string) => {
        let domain = extractDomain(url);
        if (!domain) {
            return; // Shouldn't happen
        }
        let k = getDomainKey(domain);
        if (!k) {
            navigation.navigate('Install', { url });
        } else {
            navigation.navigate('App', { url });
        }
    }, []);

    const onDisconnectApp = useCallback((url: string) => {
        let refs = getConnectionReferences();
        let toRemove = refs.filter((v) => v.url.toLowerCase() === url.toLowerCase());
        if (toRemove.length === 0) {
            return;
        }

        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [{ text: t('common.cancel') }, {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
                for (let s of toRemove) {
                    addPendingRevoke(s.key);
                    removeConnectionReference(s.key);
                    backoff('revoke', async () => {
                        await axios.post('https://connect.tonhubapi.com/connect/revoke', { key: s.key }, { timeout: 5000 });
                        removePendingRevoke(s.key);
                    });
                }
                setApps(groupItems(getConnectionReferences()));
            }
        }]);
    }, []);

    const onRemoveExtension = useCallback((key: string) => {
        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [{ text: t('common.cancel') }, {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
                removeExtension(key);
            }
        }]);
    }, [removeExtension]);

    let disconnectConnectApp = useCallback((key: string) => {
        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [{ text: t('common.cancel') }, {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
                disconnectConnect(key);
            }
        }]);
    }, [disconnectConnect]);

    // 
    // Lottie animation
    // 
    const anim = useRef<LottieView>(null);
    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            setTimeout(() => {
                anim.current?.play()
            }, 300);
        }
    }, []);

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

    useTrackScreen('Browser', network.isTestnet);

    useFocusEffect(useCallback(() => {
        setApps(groupItems(getConnectionReferences()));
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    }, []));

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
                                tintColor: theme.iconPrimary
                            }}
                        />
                    </Pressable>
                }
                style={{ marginBottom: 8 }}
            />
            <SegmentedControl
                values={[t('connections.extensions'), t('connections.connections')]}
                selectedIndex={isExtensions ? 0 : 1}
                appearance={theme.style === 'dark' ? 'dark' : 'light'}
                onChange={(event) => setIsExtensions(event.nativeEvent.selectedSegmentIndex === 0)}
                style={{ marginHorizontal: 16 }}
                backgroundColor={theme.backgroundPrimary}
                fontStyle={{ fontSize: 15, fontWeight: '500', color: theme.textPrimary }}
                activeFontStyle={{ fontSize: 15, fontWeight: '500', color: theme.textPrimary }}
            />
            <Animated.ScrollView
                entering={FadeIn}
                exiting={FadeOut}
                contentInset={{ bottom: bottomBarHeight, top: 0.1 }}
                style={{ flexGrow: 1, marginTop: 24, }}
            >
                {isExtensions
                    ? (
                        <>
                            <View style={{
                                marginBottom: 16, marginTop: 0,
                                borderRadius: 14,
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexShrink: 1,
                            }}>
                                {(extensions.length === 0 && tonconnectApps.length === 0) && (
                                    <Text style={{
                                        fontSize: 32,
                                        fontWeight: '600',
                                        marginHorizontal: 24,
                                        textAlign: 'center',
                                        color: theme.textPrimary,
                                        marginTop: (window.height / 4) + safeArea.top,
                                    }}>
                                        {t('auth.noExtensions')}
                                    </Text>
                                )}
                                {extensions.map((app) => (
                                    <View key={`app-${app.url}`} style={{ width: '100%', marginBottom: 8 }}>
                                        <ConnectionButton
                                            onPress={() => openExtension(app.url)}
                                            onRevoke={() => onRemoveExtension(app.url)}
                                            onLongPress={() => onRemoveExtension(app.url)}
                                            url={app.url}
                                            name={app.title}
                                        />
                                    </View>
                                ))}
                                {tonconnectApps.map((app) => (
                                    <View key={`app-${app.url}`} style={{ width: '100%', marginBottom: 8 }}>
                                        <ConnectionButton
                                            onRevoke={() => disconnectConnectApp(app.url)}
                                            onPress={() => navigation.navigate('ConnectApp', { url: app.url })}
                                            url={app.url}
                                            name={app.name}
                                            tonconnect
                                        />
                                    </View>
                                ))}
                            </View>
                            <View style={{ height: Platform.OS === 'android' ? 64 : safeArea.bottom }} />
                        </>
                    )
                    : (
                        <>
                            <View style={{
                                marginBottom: 16, marginTop: 0,
                                borderRadius: 14,
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexShrink: 1,
                            }}>
                                {apps.length === 0 && (
                                    <Text style={{
                                        fontSize: 32,
                                        fontWeight: '600',
                                        marginHorizontal: 24,
                                        textAlign: 'center',
                                        color: theme.textPrimary,
                                        marginTop: (window.height / 4) + safeArea.top,
                                    }}>
                                        {t('auth.noApps')}
                                    </Text>
                                )}
                                {apps.map((app) => (
                                    <View key={`app-${app.url}`} style={{ width: '100%', marginBottom: 8 }}>
                                        <ConnectionButton
                                            onRevoke={() => onDisconnectApp(app.url)}
                                            url={app.url}
                                            name={app.name}
                                        />
                                    </View>
                                ))}
                            </View>
                            <View style={{ height: Platform.OS === 'android' ? 64 : safeArea.bottom }} />
                        </>
                    )
                }
            </Animated.ScrollView>
        </View>
    );
});