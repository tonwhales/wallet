import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
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
    let removeExtension = React.useCallback((url: string) => {
        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [{ text: t('common.cancel') }, {
            text: t('auth.revoke.action'),
            style: 'destructive',
            onPress: () => {
                engine.products.extensions.removeExtension(url);
            }
        }]);
    }, []);
    if (apps.length === 0 && extensions.length === 0) {
        return (
            <View style={{
                flexGrow: 1, flexBasis: 0,
                justifyContent: 'center', alignItems: 'center',
            }}>
                <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
                <AndroidToolbar style={{
                    position: 'absolute',
                    top: safeArea.top, left: 0, right: 0
                }} />
                {Platform.OS === 'ios' && (
                    <View style={{
                        position: 'absolute',
                        top: 12, left: 0, right: 0,
                        justifyContent: 'center', alignItems: 'center',
                        height: 32
                    }}>
                        <Text style={[{
                            fontWeight: '600',
                            marginLeft: 17,
                            fontSize: 17
                        }, { textAlign: 'center' }]}>{t('auth.apps.title')}</Text>
                    </View>
                )}
                <Text style={{ fontSize: 24, textAlign: 'center', color: Theme.textSecondary }}>{t('auth.noApps')}</Text>
                {Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            navigation.goBack();
                        }}
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
            <AndroidToolbar />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 12,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
                        fontSize: 17
                    }, { textAlign: 'center' }]}>{t('auth.name')}</Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    marginHorizontal: 16,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>
                    {extensions.length > 0 && (
                        <View style={{ marginTop: 8, backgroundColor: Theme.background, alignSelf: 'flex-start' }} collapsable={false}>
                            <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('connections.extensions')}</Text>
                        </View>
                    )}
                    {extensions.map((app) => (
                        <View key={`app-${app.url}`} style={{ marginHorizontal: 16, width: '100%', marginBottom: 8 }}>
                            <ConnectedAppButton
                                onRevoke={() => removeExtension(app.url)}
                                url={app.url}
                                name={app.name}
                            />
                        </View>
                    ))}
                    {extensions.length > 0 && (
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
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});