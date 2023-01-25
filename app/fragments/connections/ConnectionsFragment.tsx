import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { CloseButton } from '../../components/CloseButton';
import { ConnectedAppButton } from '../../components/ConnectedAppButton';
import { useEngine } from '../../engine/Engine';
import { fragment } from '../../fragment';
import { t } from '../../i18n/t';
import { addPendingRevoke, getConnectionReferences, removeConnectionReference, removePendingRevoke } from "../../storage/appState";
import { Theme } from '../../Theme';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import LottieView from 'lottie-react-native';

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
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const extensions = engine.products.extensions.useExtensions();
    let [apps, setApps] = React.useState(groupItems(getConnectionReferences()));
    let disconnectApp = React.useCallback((url: string) => {

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
    let removeExtension = React.useCallback((key: string) => {
        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [{ text: t('common.cancel') }, {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
                engine.products.extensions.removeExtension(key);
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

    if (apps.length === 0 && extensions.length === 0) {
        return (
            <View style={{
                flexGrow: 1,
                paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            }}>
                <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
                <AndroidToolbar pageTitle={t('auth.apps.title')} />
                {Platform.OS === 'ios' && (
                    <View style={{
                        marginTop: 17,
                        height: 32
                    }}>
                        <Text style={[{
                            fontWeight: '600',
                            fontSize: 17
                        }, { textAlign: 'center' }]}>{t('auth.apps.title')}</Text>
                    </View>
                )}
                <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
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
                        color: '#6D6D71',
                    }}>
                        {t('auth.apps.description')}
                    </Text>
                </View>
                {Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => { navigation.goBack() }}
                    />
                )}
            </View>
        );
    }

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('auth.apps.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17,
                        textAlign: 'center'
                    }]}>
                        {t('auth.apps.title')}
                    </Text>
                </View>
            )}
            <ScrollView style={{ flexGrow: 1 }}>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    marginHorizontal: 16,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: '#6D6D71',
                    }}>
                        {t('auth.apps.description')}
                    </Text>
                    {extensions.length > 0 && (
                        <View style={{ marginTop: 8, backgroundColor: Theme.background, alignSelf: 'flex-start' }} collapsable={false}>
                            <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('connections.extensions')}</Text>
                        </View>
                    )}
                    {extensions.map((app) => (
                        <View key={`app-${app.url}`} style={{ marginHorizontal: 16, width: '100%', marginBottom: 8 }}>
                            <ConnectedAppButton
                                onRevoke={() => removeExtension(app.key)}
                                url={app.url}
                                name={app.name}
                            />
                        </View>
                    ))}
                    {apps.length > 0 && (
                        <View style={{ marginTop: 8, backgroundColor: Theme.background, alignSelf: 'flex-start' }} collapsable={false}>
                            <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('connections.connections')}</Text>
                        </View>
                    )}
                    {apps.map((app) => (
                        <View key={`app-${app.url}`} style={{ marginHorizontal: 16, width: '100%', marginBottom: 8 }}>
                            <ConnectedAppButton
                                onRevoke={() => disconnectApp(app.url)}
                                url={app.url}
                                name={app.name}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => { navigation.goBack() }}
                />
            )}
        </View>
    );
});