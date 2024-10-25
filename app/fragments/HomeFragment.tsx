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
import { useLinkNavigator } from "../useLinkNavigator";
import { TransactionsFragment } from './wallet/TransactionsFragment';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BrowserFragment } from './connections/BrowserFragment';
import DeviceInfo from 'react-native-device-info';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { getDeviceScreenCurve } from '../utils/iOSDeviceCurves';
import { Platform } from 'react-native';
import { useConnectPendingRequests, useNetwork, useTheme } from '../engine/hooks';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../components/styles';
import { TransactionDescription } from '../engine/types';
import { useParams } from '../utils/useParams';
import { TonConnectAuthType } from './secure/dapps/TonConnectAuthenticateFragment';
import { TransferFragmentProps } from './secure/TransferFragment';
import { HoldersAppParams } from './holders/HoldersAppFragment';

const Tab = createBottomTabNavigator();

export type HomeFragmentProps = {
    navigateTo?: {
        type: 'tx',
        transaction: TransactionDescription
    } | {
        type: 'tonconnect-request',
        request: TransferFragmentProps
    } | {
        type: 'holders-landing',
        endpoint: string;
        onEnrollType: HoldersAppParams;
    } | {
        type: 'holders-app',
        params: HoldersAppParams;
    }
};

export const HomeFragment = fragment(() => {
    const network = useNetwork();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const { navigateTo } = useParams<HomeFragmentProps>();
    const navigation = useTypedNavigation();
    const [tonconnectRequests] = useConnectPendingRequests();
    const linkNavigator = useLinkNavigator(
        network.isTestnet,
        { marginBottom: Platform.select({ ios: 32 + 64, android: 16 }) },
        TonConnectAuthType.Link
    );

    const [curve, setCurve] = useState<number | undefined>(undefined);

    // Subscribe for links
    useEffect(() => {
        return CachedLinking.setListener((link: string) => {
            let resolved = resolveUrl(link, network.isTestnet);
            if (resolved) {
                try {
                    SplashScreen.hideAsync();
                } catch (e) {
                    // Ignore
                }
                linkNavigator(resolved);
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
        } else if (navigateTo?.type === 'tonconnect-request') {
            navigation.navigateTransfer(navigateTo.request);
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
                        freezeOnBlur: true,
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
                                if (tonconnectRequests.length > 0) {
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