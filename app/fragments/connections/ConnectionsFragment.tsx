import axios from 'axios';
import * as React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
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

import Scanner from '../../../assets/ic-scanner-accent.svg';
import { extractDomain } from '../../engine/utils/extractDomain';

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
    const extensions = engine.products.extensions.useExtensions();
    const tonconnectApps = engine.products.tonConnect.useExtensions();
    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);
    let [apps, setApps] = useState(groupItems(getConnectionReferences()));

    const openExtension = React.useCallback((url: string) => {
        let domain = extractDomain(url);
        if (!domain) {
            return; // Shouldn't happen
        }
        let k = engine.persistence.domainKeys.getValue(domain);
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

    return (
        <View style={{ flex: 1 }}>
            {(
                apps.length === 0
                && extensions.length === 0
                && tonconnectApps.length === 0
            ) && (
                    <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'absolute', top: Platform.OS === 'android' ? 56 : 0, left: 0, right: 0, bottom: 0,
                        paddingHorizontal: 16
                    }}>
                        <LottieView
                            ref={anim}
                            source={require('../../../assets/animations/empty.json')}
                            autoPlay={true}
                            loop={true}
                            style={{ width: 128, height: 128, maxWidth: 140, maxHeight: 140 }}
                        />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            marginHorizontal: 8,
                            marginBottom: 8,
                            textAlign: 'center',
                            color: Theme.textColor,
                        }}
                        >
                            {t('auth.noApps')}
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            color: Theme.priceSecondary,
                        }}>
                            {t('auth.apps.description')}
                        </Text>
                    </View>
                )}
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
            {!(
                apps.length === 0
                && extensions.length === 0
                && tonconnectApps.length === 0
            ) && (
                    <ScrollView style={{ flexGrow: 1 }}>
                        <View style={{
                            marginBottom: 16, marginTop: 17,
                            borderRadius: 14,
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexShrink: 1,
                        }}>
                            {extensions.length > 0 && (
                                <View style={{ marginTop: 8, alignSelf: 'flex-start', marginHorizontal: 16 }} collapsable={false}>
                                    <Text style={{ fontSize: 18, fontWeight: '700', marginVertical: 8 }}>{t('connections.extensions')}</Text>
                                </View>
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
                            {(apps.length > 0 || tonconnectApps.length > 0) && (
                                <View style={{ marginTop: 8, alignSelf: 'flex-start', marginHorizontal: 16 }} collapsable={false}>
                                    <Text style={{ fontSize: 18, fontWeight: '700', marginVertical: 8 }}>{t('connections.connections')}</Text>
                                </View>
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
                    </ScrollView>
                )}
        </View>
    );
});