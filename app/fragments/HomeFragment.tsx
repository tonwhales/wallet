import * as React from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { fragment } from "../fragment";
import { Theme } from '../Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletFragment } from './wallet/WalletFragment';
import { SettingsFragment } from './SettingsFragment';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { CachedLinking } from '../utils/CachedLinking';
import { resolveUrl } from '../utils/resolveUrl';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { AppConfig } from '../AppConfig';
import { t } from '../i18n/t';
import * as SplashScreen from 'expo-splash-screen';
import { useGlobalLoader } from '../components/useGlobalLoader';
import { backoff } from '../utils/time';
import { useEngine } from '../engine/Engine';
import { useLinkNavigator } from '../Navigation';
import { getConnectionReferences } from '../storage/appState';
import { useTrackScreen } from '../analytics/mixpanel';
import { TransactionsFragment } from './wallet/TransactionsFragment';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// import HomeIcon from '../../assets/ic_home.svg';
// import HistoryIcon from '../../assets/ic_history.svg';
// import SettingsIcon from '../../assets/ic_settings.svg';

const Tab = createBottomTabNavigator();

export const HomeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const [tab, setTab] = React.useState(0);
    const navigation = useTypedNavigation();
    const loader = useGlobalLoader()
    const engine = useEngine();
    const linkNavigator = useLinkNavigator();

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
                                SplashScreen.hideAsync();
                                if (existing.job.job.payload) {
                                    navigation.navigateTransfer({
                                        order: {
                                            target: existing.job.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                                            amount: existing.job.job.amount,
                                            amountAll: false,
                                            payload: existing.job.job.payload,
                                            stateInit: existing.job.job.stateInit,
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

    if (tab === 0) {
        useTrackScreen('Wallet');
    } else if (tab === 1) {
        useTrackScreen('Transactions');
    } else if (tab === 2) {
        useTrackScreen('Settings');
    }

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={'dark'} />
            <Tab.Navigator
                initialRouteName={'Wallet'}
                screenOptions={({ route }) => ({
                    headerShown: false,
                    title: route.name === 'Wallet'
                        ? t('home.wallet')
                        : route.name === 'Transactions'
                            ? t('transactions.history')
                            : t('home.settings'),
                    tabBarIcon: ({ focused, color, size }) => {
                        if (route.name === 'Wallet') {
                            // return <WalletIcon/>
                        } else if (route.name === 'Settings') {
                            // return <SettingsIcon/>
                        } else if (route.name === 'Transactions') {
                            // return <HistoryIcon/>
                        }
                    },
                })}
            >
                <Tab.Screen
                    name="Wallet"
                    component={WalletFragment}
                />
                <Tab.Screen
                    name="Transactions"
                    component={TransactionsFragment}
                />
                <Tab.Screen
                    name="Settings"
                    component={SettingsFragment}
                />
            </Tab.Navigator>
        </View>
    );
}, true);