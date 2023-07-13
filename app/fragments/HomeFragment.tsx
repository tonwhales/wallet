import * as React from 'react';
import { Image, View } from 'react-native';
import { fragment } from "../fragment";
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
import { TransactionsFragment } from './wallet/TransactionsFragment';
import { useAppConfig } from '../utils/AppConfigContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ConnectionsFragment } from './connections/ConnectionsFragment';

const Tab = createBottomTabNavigator();

export const HomeFragment = fragment(() => {
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
                screenOptions={({ route }) => ({
                    headerShown: false,
                    header: undefined,
                    unmountOnBlur: true,
                    tabBarIcon: ({ focused, color, size }) => {
                        let source = require('../../assets/ic-home.png');
                        if (route.name === 'Transactions') {
                            source = require('../../assets/ic-history.png');
                        }
                        if (route.name === 'Browser') {
                            source = require('../../assets/ic-services.png');
                        }
                        if (route.name === 'More') {
                            source = require('../../assets/ic_settings.png');
                        }
                        return (
                            <Image
                                source={source}
                                style={{
                                    tintColor: focused ? Theme.accent : Theme.greyForIcon,
                                    height: 24, width: 24
                                }}
                            />
                        )
                    }
                })}
            >
                <Tab.Screen
                    options={{ title: t('home.home') }}
                    name={'Wallet'}
                    component={WalletFragment}
                />
                <Tab.Screen
                    options={{ title: t('home.history') }}
                    name={'Transactions'}
                    component={TransactionsFragment}
                />
                <Tab.Screen
                    options={{ title: t('home.browser') }}
                    name={'Browser'}
                    component={ConnectionsFragment}
                />
                <Tab.Screen
                    options={{ title: t('home.more') }}
                    name={'More'}
                    component={SettingsFragment}
                />
            </Tab.Navigator>
        </View>
    );
}, true);