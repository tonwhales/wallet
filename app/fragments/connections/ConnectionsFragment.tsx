import axios from 'axios';
import * as React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectionButton } from '../../components/ConnectionButton';
import { useEngine } from '../../engine/Engine';
import { fragment } from '../../fragment';
import { t } from '../../i18n/t';
import { addPendingRevoke, getConnectionReferences, removeConnectionReference, removePendingRevoke } from "../../storage/appState";
import { backoff } from '../../utils/time';
import { useAppConfig } from '../../utils/AppConfigContext';
import { TabHeader } from '../../components/topbar/TabHeader';
import { useTrackScreen } from '../../analytics/mixpanel';
import LottieView from 'lottie-react-native';
import { resolveUrl } from '../../utils/resolveUrl';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useLinkNavigator } from '../../useLinkNavigator';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { extractDomain } from '../../engine/utils/extractDomain';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';

import Scanner from '../../../assets/ic-scanner-accent.svg';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

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
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const window = useWindowDimensions();
    const extensions = engine.products.extensions.useExtensions();
    const tonconnectApps = engine.products.tonConnect.useExtensions();
    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);

    const [isExtensions, setIsExtensions] = useState(true);
    let [apps, setApps] = useState(groupItems(getConnectionReferences()));

    const openExtension = React.useCallback((url: string) => {
        let domain = extractDomain(url);
        if (!domain) {
            return; // Shouldn't happen
        }
        let k = engine.products.keys.getDomainKey(domain);
        if (!k) {
            navigation.navigate('Install', { url });
        } else {
            navigation.navigate('App', { url });
        }
    }, []);

    const disconnectApp = useCallback((url: string) => {
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

    const removeExtension = useCallback((key: string) => {
        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [{ text: t('common.cancel') }, {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
                engine.products.extensions.removeExtension(key);
            }
        }]);
    }, []);

    let disconnectConnectApp = useCallback((key: string) => {
        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [{ text: t('common.cancel') }, {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
                engine.products.tonConnect.disconnect(key);
            }
        }]);
    }, []);

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
            let res = resolveUrl(src, AppConfig.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch {
            // Ignore
        }
    };

    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);

    useTrackScreen('Browser', engine.isTestnet);

    useFocusEffect(useCallback(() => {
        setApps(groupItems(getConnectionReferences()));
        setTimeout(() => {
            setStatusBarStyle('dark');
        }, 100);
    }, []));

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style={'dark'} />
            <TabHeader
                title={t('home.browser')}
                rightAction={
                    <Pressable
                        style={({ pressed }) => { return { opacity: pressed ? 0.5 : 1 } }}
                        onPress={openScanner}
                    >
                        <Scanner
                            style={{
                                height: 24,
                                width: 24,
                                marginLeft: 14
                            }}
                            height={24}
                            width={24}
                            color={Theme.greyForIcon}
                        />
                    </Pressable>
                }
            />
            <SegmentedControl
                values={[t('connections.extensions'), t('connections.connections')]}
                selectedIndex={isExtensions ? 0 : 1}
                onChange={(event) => setIsExtensions(event.nativeEvent.selectedSegmentIndex === 0)}
                style={{ marginHorizontal: 16 }}
            />
            {isExtensions
                ? (
                    <Animated.ScrollView
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={{ flexGrow: 1, marginTop: 24, }}
                    >
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
                                    color: Theme.textColor,
                                    marginTop: (window.height / 4) + safeArea.top,
                                }}>
                                    {t('auth.noExtensions')}
                                </Text>
                            )}
                            {extensions.map((app) => (
                                <View key={`app-${app.url}`} style={{ width: '100%', marginBottom: 8 }}>
                                    <ConnectionButton
                                        onPress={() => openExtension(app.url)}
                                        onRevoke={() => removeExtension(app.key)}
                                        onLongPress={() => removeExtension(app.key)}
                                        url={app.url}
                                        name={app.name}
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
                    </Animated.ScrollView>
                )
                : (
                    <Animated.ScrollView
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={{ flexGrow: 1, marginTop: 24, }}
                    >
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
                                    color: Theme.textColor,
                                    marginTop: (window.height / 4) + safeArea.top,
                                }}>
                                    {t('auth.noApps')}
                                </Text>
                            )}
                            {apps.map((app) => (
                                <View key={`app-${app.url}`} style={{ width: '100%', marginBottom: 8 }}>
                                    <ConnectionButton
                                        onRevoke={() => disconnectApp(app.url)}
                                        url={app.url}
                                        name={app.name}
                                    />
                                </View>
                            ))}
                        </View>
                        <View style={{ height: Platform.OS === 'android' ? 64 : safeArea.bottom }} />
                    </Animated.ScrollView>
                )
            }
        </View>
    );
});