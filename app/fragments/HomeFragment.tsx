import * as React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { fragment } from "../fragment";
import { WalletNavigationStack } from './wallet/WalletFragment';
import { SettingsFragment } from './SettingsFragment';
import { CachedLinking } from '../utils/CachedLinking';
import { resolveUrl } from '../utils/resolveUrl';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { t } from '../i18n/t';
import * as SplashScreen from 'expo-splash-screen';
import { useGlobalLoader } from '../components/useGlobalLoader';
import { backoff } from '../utils/time';
import { useLinkNavigator } from "../useLinkNavigator";
import { getConnectionReferences } from '../storage/appState';
import { TransactionsFragment } from './wallet/TransactionsFragment';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BrowserFragment } from './connections/BrowserFragment';
import DeviceInfo from 'react-native-device-info';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { getDeviceScreenCurve } from '../utils/iOSDeviceCurves';
import { Platform } from 'react-native';
import { useConnectPendingRequests, useNetwork, useTheme } from '../engine/hooks';
import { fetchJob, useCurrentJob } from '../engine/hooks/dapps/useCurrentJob';
import { parseJob } from '../engine/apps/parseJob';
import { Cell } from '@ton/core';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../components/styles';
import { TransactionDescription } from '../engine/types';
import { useParams } from '../utils/useParams';

const Tab = createBottomTabNavigator();

export type HomeFragmentProps = {
    navigateTo?: {
        type: 'tx',
        transaction: TransactionDescription
    }
};

export const HomeFragment = fragment(() => {
    const network = useNetwork();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const { navigateTo } = useParams<HomeFragmentProps>();
    const navigation = useTypedNavigation();
    const loader = useGlobalLoader()
    const [tonXRequest,] = useCurrentJob();
    const [tonconnectRequests,] = useConnectPendingRequests();
    const linkNavigator = useLinkNavigator(network.isTestnet);

    const [curve, setCurve] = useState<number | undefined>(undefined);

    // Subscribe for links
    useEffect(() => {
        return CachedLinking.setListener((link: string) => {
            if (link === '/job') {
                let canceller = loader.show();
                (async () => {
                    try {
                        await backoff('home', async () => {
                            let fetchedJob = await fetchJob();
                            if (!fetchedJob) {
                                return;
                            }
                            let jobCell = Cell.fromBoc(Buffer.from(fetchedJob, 'base64'))[0];
                            let parsed = parseJob(jobCell.beginParse());
                            if (!parsed) {
                                return;
                            }

                            const existing = { ...parsed, jobCell, jobRaw: fetchedJob }

                            if (existing.job.type === 'transaction') {
                                try {
                                    SplashScreen.hideAsync();
                                } catch (e) {
                                    // Ignore
                                }
                                if (existing.job.payload) {
                                    navigation.navigateTransfer({
                                        order: {
                                            type: 'order',
                                            messages: [{
                                                target: existing.job.target.toString({ testOnly: network.isTestnet }),
                                                amount: existing.job.amount,
                                                amountAll: false,
                                                payload: existing.job.payload,
                                                stateInit: existing.job.stateInit,
                                            }]
                                        },
                                        text: existing.job.text,
                                        job: existing.jobRaw,
                                        callback: null
                                    });
                                } else {
                                    navigation.navigateSimpleTransfer({
                                        target: existing.job.target.toString({ testOnly: network.isTestnet }),
                                        comment: existing.job.text,
                                        amount: existing.job.amount,
                                        stateInit: existing.job.stateInit,
                                        job: existing.jobRaw,
                                        jetton: null,
                                        callback: null
                                    })
                                }
                            }
                            if (existing.job.type === 'sign') {
                                const connection = getConnectionReferences().find((v) => Buffer.from(v.key, 'base64').equals(existing!.key));
                                if (!connection) {
                                    return; // Just in case
                                }
                                navigation.navigateSign({
                                    text: existing.job.text,
                                    textCell: existing.job.textCell,
                                    payloadCell: existing.job.payloadCell,
                                    job: existing.jobRaw,
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
                let resolved = resolveUrl(link, network.isTestnet);
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

    const onBlur = useCallback(() => {
        // Setting backdrop screens curve to device curve if we are navigating 
        // to a specefic 'short' modal screen
        const status = navigation.base.getState();
        const selectorOrLogout = status.routes.find((r: { key: string, name: string }) => {
            return r.name === 'AccountSelector' || r.name === 'StakingPoolSelector';
        });
        if (selectorOrLogout) {
            const deviceId = DeviceInfo.getDeviceId();
            const dCurve = getDeviceScreenCurve(deviceId);
            setCurve(dCurve);
        } else {
            setCurve(undefined);
        }
    }, []);

    useEffect(() => {
        if (navigateTo?.type === 'tx') {
            navigation.navigate('Transaction', { transaction: navigateTo.transaction });
        }
    }, []);

    useLayoutEffect(() => {
        if (Platform.OS === 'ios') {
            navigation.base.addListener('blur', onBlur);

            return () => {
                navigation.base.removeListener('blur', onBlur);
            }
        }
    }, []);

    return (
        <View style={{
            flexGrow: 1,
            backgroundColor: theme.black,
        }}>
            <View style={{
                flexGrow: 1,
                borderTopEndRadius: curve,
                borderTopStartRadius: curve,
                overflow: 'hidden'
            }}>
                <Tab.Navigator
                    initialRouteName={'Wallet-Stack'}
                    screenOptions={({ route }) => ({
                        headerShown: false,
                        header: undefined,
                        unmountOnBlur: false,
                        freezeOnBlur: route.name === 'Transactions',
                        tabBarStyle: {
                            backgroundColor: theme.transparent,
                            borderTopColor: theme.border,
                            ...Platform.select({
                                ios: {
                                    backgroundColor: theme.transparent,
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                },
                                android: { backgroundColor: theme.surfaceOnBg }
                            })
                        },
                        tabBarItemStyle: { marginBottom: safeArea.bottom === 0 ? 8 : undefined },
                        tabBarBackground: Platform.OS === 'ios' ? () => {
                            return (
                                <BlurView
                                    tint={theme.style === 'light' ? 'light' : 'dark'}
                                    intensity={80}
                                    style={StyleSheet.absoluteFill}
                                />
                            )
                        } : undefined,
                        tabBarActiveTintColor: theme.accent,
                        tabBarInactiveTintColor: theme.textSecondary,
                        tabBarLabelStyle: [{ marginTop: -4 }, Typography.medium10_12],
                        tabBarIcon: ({ focused }) => {
                            let source = require('@assets/ic-home.png');

                            if (route.name === 'Wallet-Stack') {
                                if (!!tonXRequest || tonconnectRequests.length > 0) {
                                    source = focused
                                        ? require('@assets/ic-home-active-badge.png')
                                        : require('@assets/ic-home-badge.png');
                                    return (
                                        <Image
                                            source={source}
                                            style={{ height: 24, width: 24 }}
                                        />
                                    )
                                }
                            }

                            if (route.name === 'Transactions') {
                                source = require('@assets/ic-history.png');
                            }

                            if (route.name === 'Browser') {
                                source = require('@assets/ic-services.png');
                            }

                            if (route.name === 'More') {
                                source = require('@assets/ic-settings.png');
                            }

                            return (
                                <Image
                                    source={source}
                                    style={{
                                        tintColor: focused ? theme.accent : theme.iconPrimary,
                                        height: 24, width: 24
                                    }}
                                />
                            )
                        }
                    })}
                >
                    <Tab.Screen
                        options={{ title: t('home.home') }}
                        name={'Wallet-Stack'}
                        component={WalletNavigationStack}
                    />
                    <Tab.Screen
                        options={{ title: t('home.history') }}
                        name={'Transactions'}
                        component={TransactionsFragment}
                    />
                    <Tab.Screen
                        options={{ title: t('home.browser') }}
                        name={'Browser'}
                        component={BrowserFragment}
                    />
                    <Tab.Screen
                        options={{ title: t('home.more') }}
                        name={'More'}
                        component={SettingsFragment}
                    />
                </Tab.Navigator>
            </View>
        </View>
    );
});