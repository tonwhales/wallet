import * as React from 'react';
import { Image, Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { fragment } from "../fragment";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletFragment } from './wallet/WalletFragment';
import { SettingsFragment } from './SettingsFragment';
import { CachedLinking } from '../utils/CachedLinking';
import { resolveUrl } from '../utils/resolveUrl';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { t } from '../i18n/t';
import * as SplashScreen from 'expo-splash-screen';
import { useGlobalLoader } from '../components/useGlobalLoader';
import { backoff } from '../utils/time';
import { useEngine } from '../engine/Engine';
import { useLinkNavigator } from "../useLinkNavigator";
import { getConnectionReferences } from '../storage/appState';
import { trackScreen } from '../analytics/mixpanel';
import { TransactionsFragment } from './wallet/TransactionsFragment';
import { useAppConfig } from '../utils/AppConfigContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ConnectionsFragment } from './connections/ConnectionsFragment';
import { StatusBar } from 'expo-status-bar';

const Tab = createBottomTabNavigator();

const tabButtonStyle: StyleProp<ViewStyle> = {
    height: 49, flexGrow: 1, flexBasis: 0,
    alignItems: 'center', justifyContent: 'center'
}

const tabButtonTextStyle: StyleProp<TextStyle> = {
    fontSize: 10, lineHeight: 12,
    fontWeight: '500',
    marginTop: 5,
}

export const HomeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const loader = useGlobalLoader()
    const engine = useEngine();
    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);

    // Subscribe for links
    React.useEffect(() => {
        return CachedLinking.setListener((link: string) => {
            if (link === '/job') {
                let canceller = loader.show();
                (async () => {
                    try {
                        await backoff('home', async () => {
                            let existing = await engine.products.apps.fetchJob();
                            if (!existing) {
                                return;
                            }

                            if (existing.job.job.type === 'transaction') {
                                try {
                                    SplashScreen.hideAsync();
                                } catch (e) {
                                    // Ignore
                                }
                                if (existing.job.job.payload) {
                                    navigation.navigateTransfer({
                                        order: {
                                            messages: [{
                                                target: existing.job.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                                                amount: existing.job.job.amount,
                                                amountAll: false,
                                                payload: existing.job.job.payload,
                                                stateInit: existing.job.job.stateInit,
                                            }]
                                        },
                                        text: existing.job.job.text,
                                        job: existing.raw,
                                        callback: null
                                    });
                                } else {
                                    navigation.navigateSimpleTransfer({
                                        target: existing.job.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                                        comment: existing.job.job.text,
                                        amount: existing.job.job.amount,
                                        stateInit: existing.job.job.stateInit,
                                        job: existing.raw,
                                        jetton: null,
                                        callback: null
                                    })
                                }
                            }
                            if (existing.job.job.type === 'sign') {
                                const connection = getConnectionReferences().find((v) => Buffer.from(v.key, 'base64').equals(existing!.job.key));
                                if (!connection) {
                                    return; // Just in case
                                }
                                navigation.navigateSign({
                                    text: existing.job.job.text,
                                    textCell: existing.job.job.textCell,
                                    payloadCell: existing.job.job.payloadCell,
                                    job: existing.raw,
                                    callback: null,
                                    name: connection.name
                                });
                            }
                        });
                    } finally {
                        canceller();
                    }
                })()
            } else {
                let resolved = resolveUrl(link, AppConfig.isTestnet);
                if (resolved) {
                    try {
                        SplashScreen.hideAsync();
                    } catch (e) {
                        // Ignore
                    }
                    linkNavigator(resolved);
                }
            }
        });
    }, []);

    return (
        <View style={{ flexGrow: 1, backgroundColor: 'white', }}>
            <Tab.Navigator
                initialRouteName={'Wallet'}
                tabBar={(props) => {
                    return (
                        <View
                            style={{
                                height: 49 + (safeArea.bottom === 0 ? 16 : safeArea.bottom), paddingHorizontal: 16,
                                backgroundColor: 'white',
                                borderTopEndRadius: 20, borderTopStartRadius: 20,
                                shadowColor: 'rgba(0, 0, 0, 0.1)',
                                shadowOffset: { width: 0, height: 2 },
                                shadowRadius: 14,
                                shadowOpacity: 1,
                            }}
                        >
                            <StatusBar style={props.state.index === 0 ? 'light' : 'dark'} />
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                paddingBottom: 2, paddingTop: 9
                            }}>
                                <Pressable
                                    style={tabButtonStyle}
                                    onPress={() => {
                                        props.navigation.navigate('Wallet')
                                        trackScreen('Wallet', undefined, AppConfig.isTestnet);
                                    }}
                                >
                                    <Image
                                        source={require('../../assets/ic-home.png')}
                                        style={{
                                            tintColor: props.state.index === 0 ? Theme.accent : Theme.textSecondary,
                                            height: 24, width: 24
                                        }}
                                    />
                                    <Text style={{
                                        color: props.state.index === 0 ? Theme.accent : Theme.textSecondary,
                                        ...tabButtonTextStyle
                                    }}>
                                        {t('home.home')}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={tabButtonStyle}
                                    onPress={() => {
                                        props.navigation.navigate('Transactions');
                                        trackScreen('Transactions', undefined, AppConfig.isTestnet);
                                    }}
                                >
                                    <Image
                                        source={require('../../assets/ic-history.png')}
                                        style={{
                                            tintColor: props.state.index === 1 ? Theme.accent : Theme.textSecondary,
                                            height: 24, width: 24
                                        }}
                                    />
                                    <Text
                                        style={{
                                            color: props.state.index === 1 ? Theme.accent : Theme.textSecondary,
                                            ...tabButtonTextStyle
                                        }}
                                    >
                                        {t('home.history')}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={tabButtonStyle}
                                    onPress={() => {
                                        props.navigation.navigate('Browser');
                                        trackScreen('Browser', undefined, AppConfig.isTestnet)
                                    }}
                                >
                                    <Image
                                        source={require('../../assets/ic-services.png')}
                                        style={{
                                            tintColor: props.state.index === 2 ? Theme.accent : Theme.textSecondary,
                                            height: 24, width: 24
                                        }}
                                    />
                                    <Text
                                        style={{
                                            color: props.state.index === 2 ? Theme.accent : Theme.textSecondary,
                                            ...tabButtonTextStyle
                                        }}
                                    >
                                        {t('home.browser')}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={tabButtonStyle}
                                    onPress={() => {
                                        props.navigation.navigate('More');
                                        trackScreen('More', undefined, AppConfig.isTestnet);
                                    }}
                                >
                                    <Image
                                        source={props.state.index === 3 ? require('../../assets/ic_settings_selected.png') : require('../../assets/ic_settings.png')}
                                        style={{
                                            tintColor: props.state.index === 3 ? Theme.accent : Theme.textSecondary,
                                            height: 24, width: 24
                                        }}
                                    />
                                    <Text
                                        style={{
                                            color: props.state.index === 3 ? Theme.accent : Theme.textSecondary,
                                            ...tabButtonTextStyle
                                        }}
                                    >
                                        {t('home.more')}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    )
                }}
                screenOptions={({ route }) => ({
                    headerShown: false,
                    header: undefined,
                })}
            >
                <Tab.Screen name={'Wallet'} component={WalletFragment} />
                <Tab.Screen name={'Transactions'} component={TransactionsFragment} />
                <Tab.Screen name={'Browser'} component={ConnectionsFragment} />
                <Tab.Screen name={'More'} component={SettingsFragment} />
            </Tab.Navigator>
        </View>
    );
}, true);