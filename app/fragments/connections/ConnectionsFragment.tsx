import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { CloseButton } from '../../components/CloseButton';
import { ConnectedAppButton } from '../../components/ConnectedAppButton';
import { ItemButton } from '../../components/ItemButton';
import { fragment } from '../../fragment';
import { t } from '../../i18n/t';
import { addPendingRevoke, getConnectionReferences, removeConnectionReference, removePendingRevoke } from "../../storage/appState";
import { Theme } from '../../Theme';
import { formatDate } from '../../utils/dates';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';

export const ConnectionsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    let [apps, setApps] = React.useState(getConnectionReferences());
    let disconnectApp = React.useCallback((src: string) => {

        let refs = getConnectionReferences();
        let ex = refs.find((v) => v.key === src);
        if (!ex) {
            return;
        }

        Alert.alert(t('auth.revoke.title'), t('auth.revoke.message'), [
            {
                text: t('common.cancel')
            },
            {
                text: t('auth.revoke.action'), style: 'destructive', onPress: () => {
                    addPendingRevoke(src);
                    removeConnectionReference(src);
                    setApps((a) => a.filter((v) => v.key !== src));
                    backoff(async () => {
                        await axios.post('https://connect.tonhubapi.com/connect/revoke', { key: src }, { timeout: 5000 });
                        removePendingRevoke(src);
                    });
                }
            }
        ]);

    }, []);
    if (apps.length === 0) {
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
                    }, { textAlign: 'center' }]}>{t('auth.apps.title')}</Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    marginHorizontal: 16,
                    backgroundColor: "white",
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>
                    {apps.map((app) => (
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ConnectedAppButton
                                onPress={() => disconnectApp(app.key)}
                                url={app.url}
                                name={app.name}
                                key={app.key}
                                date={app.date}
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