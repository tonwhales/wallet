import * as React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { fragment } from "../fragment";
import { WalletNavigationStack } from './wallet/WalletFragment';
import { SettingsFragment } from './SettingsFragment';
import { useTypedNavigation } from '../utils/useTypedNavigation';
import { t } from '../i18n/t';
import { TransactionsFragment } from './wallet/TransactionsFragment';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BrowserFragment } from './connections/BrowserFragment';
import DeviceInfo from 'react-native-device-info';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { getDeviceScreenCurve } from '../utils/iOSDeviceCurves';
import { Platform } from 'react-native';
import { useConnectPendingRequests, useHoldersAccountStatus, useIsConnectAppReady, useLinksSubscription, useNetwork, useSelectedAccount, useTheme } from '../engine/hooks';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../components/styles';
import { TonTransaction } from '../engine/types';
import { useParams } from '../utils/useParams';
import { TransferFragmentParams } from './secure/transfer/TransferFragment';
import { HoldersAppParams } from './holders/HoldersAppFragment';
import { useAppMode } from '../engine/hooks/appstate/useAppMode';
import { HoldersSettings } from './holders/components/HoldersSettings';
import { HoldersTransactionsFragment } from './wallet/HoldersTransactionsFragment';
import { useLedgerTransport } from './ledger/components/TransportContext';
import { HoldersAIChatTab } from './holders/HoldersAIChatTab';
import { holdersUrl, HoldersUserState } from '../engine/api/holders/fetchUserState';
import { DeepLinkType } from '../utils/link-navigator/resolveAndNavigateToDeepLink';

const Tab = createBottomTabNavigator();

export type HomeFragmentProps = {
    navigateTo?: {
        type: 'tx',
        transaction: TonTransaction
    } | {
        type: 'tonconnect-request',
        request: TransferFragmentParams
    } | {
        type: 'holders-landing',
        endpoint: string;
        onEnrollType: HoldersAppParams;
    } | {
        type: 'holders-app',
        params: HoldersAppParams;
    } | {
        type: 'deep-link',
        deepLinkType: DeepLinkType;
    },
    ledger?: boolean
};

export const HomeFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const { isTestnet } = useNetwork();
    const { navigateTo, ledger } = useParams<HomeFragmentProps>();
    const navigation = useTypedNavigation();
    const [tonconnectRequests] = useConnectPendingRequests();
    const selected = useSelectedAccount();
    const [isWalletMode] = useAppMode(selected?.address);
    const url = holdersUrl(isTestnet);
    const holdersAccStatus = useHoldersAccountStatus(selected?.address).data;
    const ledgerContext = useLedgerTransport();
    const isHoldersReady = useIsConnectAppReady(url, selected?.address?.toString({ testOnly: isTestnet }));

    const needsEnrollment = useMemo(() => {
        if (!isHoldersReady) {
            return true;
        }

        if (!holdersAccStatus) {
            return true;
        }

        if (holdersAccStatus.state === HoldersUserState.NeedEnrollment) {
            return true;
        }

        return false;
    }, [holdersAccStatus, isHoldersReady]);

    const [curve, setCurve] = useState<number | undefined>(undefined);

    // Subscribe for links
    useLinksSubscription();

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
            navigation.navigateTonTransaction(navigateTo.transaction);
        } else if (navigateTo?.type === 'tonconnect-request') {
            navigation.navigateTransfer(navigateTo.request);
        } else if (navigateTo?.type === 'holders-landing') {
            navigation.navigateHoldersLanding({ endpoint: navigateTo.endpoint, onEnrollType: navigateTo.onEnrollType }, isTestnet);
        } else if (navigateTo?.type === 'holders-app') {
            navigation.navigateHolders(navigateTo.params, isTestnet);
        } else if (navigateTo?.type === 'deep-link') {
            switch (navigateTo.deepLinkType) {
                case 'new-wallet':
                    navigation.navigate('WalletCreate', { additionalWallet: true });
                    break;
                case 'deposit':
                    navigation.navigateReceiveAssets({ title: t('wallet.actions.deposit') });
                    break;
                case 'security':
                    navigation.navigate('Security');
                    break;
                case 'earnings':
                    navigation.navigateStakingPools();
                    break;
                case 'swap':
                    navigation.navigateSwap();
                    break;
                case 'send':
                    navigation.navigateSimpleTransfer({
                        target: null,
                        comment: null,
                        amount: null,
                        stateInit: null,
                        asset: null,
                        callback: null,
                    });
                    break;
            }
        }
    }, []);

    useEffect(() => {
        if (ledger) {
            ledgerContext.reset();
            navigation.navigate('Ledger');
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

                            switch (route.name) {
                                case 'Wallet-Stack':
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
                                    break;
                                case 'Transactions':
                                    source = require('@assets/ic-history.png');
                                    break;
                                case 'Browser':
                                    source = require('@assets/ic-services.png');
                                    break;
                                case 'More':
                                    source = require('@assets/ic-settings.png');
                                    break;
                                case 'AIChatTab':
                                    source = require('@assets/ic-ai-agent.png');
                                    break;
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
                        options={{ title: t('home.history'), unmountOnBlur: !isWalletMode }}
                        name={'Transactions'}
                        component={isWalletMode ? TransactionsFragment : HoldersTransactionsFragment}
                    />
                    {isWalletMode && (
                        <Tab.Screen
                            options={{ title: t('home.browser') }}
                            name={'Browser'}
                            component={BrowserFragment}
                        />
                    )}
                    {!isWalletMode && !needsEnrollment && (
                        <Tab.Screen
                            options={{ title: t('aiChat.title') }}
                            name={'AIChatTab'}
                            component={HoldersAIChatTab}
                        />
                    )}
                    <Tab.Screen
                        options={{ title: t('home.settings'), unmountOnBlur: !isWalletMode }}
                        name={'More'}
                        component={isWalletMode ? SettingsFragment : HoldersSettings}
                    />
                </Tab.Navigator>
            </View>
        </View>
    );
});