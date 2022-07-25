import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View, Image } from 'react-native';
import { WelcomeFragment } from './fragments/onboarding/WelcomeFragment';
import { WalletImportFragment } from './fragments/onboarding/WalletImportFragment';
import { WalletCreateFragment } from './fragments/onboarding/WalletCreateFragment';
import { LegalFragment } from './fragments/onboarding/LegalFragment';
import { WalletCreatedFragment } from './fragments/onboarding/WalletCreatedFragment';
import { WalletBackupFragment } from './fragments/secure/WalletBackupFragment';
import { HomeFragment } from './fragments/HomeFragment';
import { SimpleTransferFragment } from './fragments/secure/SimpleTransferFragment';
import { SettingsFragment } from './fragments/SettingsFragment';
import { ScannerFragment } from './fragments/utils/ScannerFragment';
import { MigrationFragment } from './fragments/secure/MigrationFragment';
import { ReceiveFragment } from './fragments/wallet/ReceiveFragment';
import { TransactionPreviewFragment } from './fragments/wallet/TransactionPreviewFragment';
import { PrivacyFragment } from './fragments/onboarding/PrivacyFragment';
import { TermsFragment } from './fragments/onboarding/TermsFragment';
import { SyncFragment } from './fragments/SyncFragment';
import { resolveOnboarding } from './fragments/resolveOnboarding';
import { DeveloperToolsFragment } from './fragments/dev/DeveloperToolsFragment';
import { NavigationContainer } from '@react-navigation/native';
import { NavigationTheme, Theme } from './Theme';
import { getAppState, getPendingGrant, getPendingRevoke, removePendingGrant, removePendingRevoke } from './storage/appState';
import { EngineContext, useEngine } from './engine/Engine';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { EasingNode } from 'react-native-reanimated';
import { backoff } from './utils/time';
import { registerForPushNotificationsAsync, registerPushToken } from './utils/registerPushNotifications';
import * as Notifications from 'expo-notifications';
import { PermissionStatus } from 'expo-modules-core';
import { t } from './i18n/t';
import { AuthenticateFragment } from './fragments/secure/AuthenticateFragment';
import { ConnectionsFragment } from './fragments/connections/ConnectionsFragment';
import axios from 'axios';
import { NeocryptoFragment } from './fragments/integrations/NeocryptoFragment';
import { StakingTransferFragment } from './fragments/staking/StakingTransferFragment';
import { StakingFragment } from './fragments/staking/StakingFragment';
import { SignFragment } from './fragments/secure/SignFragment';
import { TransferFragment } from './fragments/secure/TransferFragment';
import { createEngine } from './engine/createEngine';
import { useRecoilCallback } from 'recoil';
import { AppFragment } from './fragments/apps/AppFragment';
import { DevStorageFragment } from './fragments/dev/DevStorageFragment';
import { WalletUpgradeFragment } from './fragments/secure/WalletUpgradeFragment';
import { InstallFragment } from './fragments/secure/InstallFragment';
import { useTypedNavigation } from './utils/useTypedNavigation';
import { AppConfig } from './AppConfig';
import { ResolvedUrl } from './utils/resolveUrl';
import BN from 'bn.js';
import { mixpanel } from './analytics/mixpanel';
import { StakingPoolsFragment } from './fragments/staking/StakingPoolsFragment';
import { AccountsFragment } from './fragments/AccountsFragment';

const Stack = createNativeStackNavigator();
// const Stack = Platform.OS === 'ios' ? createNativeStackNavigator() : createStackNavigator();

function fullScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            key={`fullScreen-${name}`}
            name={name}
            component={component}
            options={{ headerShown: false }}
        />
    );
}

function genericScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            key={`genericScreen-${name}`}
            name={name}
            component={component}
            options={{ headerShown: Platform.OS === 'ios' }}
        />
    );
}

function formSheetScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            key={`formSheetScreen-${name}`}
            name={name}
            component={component}
            options={{ headerShown: false }}
        />
    );
}

function modalScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            key={`modalScreen-${name}`}
            name={name}
            component={component}
            options={{ presentation: 'modal', headerShown: false }}
        />
    );
}

function lockedModalScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            key={`modalScreen-${name}`}
            name={name}
            component={component}
            options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }}
        />
    );
}

// function fullScreenModal(name: string, component: React.ComponentType<any>) {
//     return (
//         <Stack.Screen
//             key={`fullScreenModal-${name}`}
//             name={name}
//             component={component}
//             options={{ presentation: 'fullScreenModal', headerShown: false }}
//         />
//     );
// }

const navigation = [
    fullScreen('Welcome', WelcomeFragment),
    fullScreen('Home', HomeFragment),
    fullScreen('Sync', SyncFragment),
    genericScreen('LegalCreate', LegalFragment),
    genericScreen('LegalImport', LegalFragment),
    genericScreen('WalletImport', WalletImportFragment),
    genericScreen('WalletCreate', WalletCreateFragment),
    genericScreen('WalletCreated', WalletCreatedFragment),
    genericScreen('WalletBackupInit', WalletBackupFragment),
    genericScreen('WalletBackup', WalletBackupFragment),
    genericScreen('WalletUpgrade', WalletUpgradeFragment),
    genericScreen('Settings', SettingsFragment),
    genericScreen('Privacy', PrivacyFragment),
    genericScreen('Terms', TermsFragment),
    modalScreen('Connections', ConnectionsFragment),
    modalScreen('Transfer', TransferFragment),
    modalScreen('SimpleTransfer', SimpleTransferFragment),
    modalScreen('Receive', ReceiveFragment),
    modalScreen('Transaction', TransactionPreviewFragment),
    modalScreen('Authenticate', AuthenticateFragment),
    modalScreen('Install', InstallFragment),
    modalScreen('Sign', SignFragment),
    modalScreen('Migration', MigrationFragment),
    lockedModalScreen('Scanner', ScannerFragment),
    genericScreen('DeveloperTools', DeveloperToolsFragment),
    genericScreen('DeveloperToolsStorage', DevStorageFragment),
    lockedModalScreen('Buy', NeocryptoFragment),
    fullScreen('Staking', StakingFragment),
    fullScreen('StakingPools', StakingPoolsFragment),
    modalScreen('StakingTransfer', StakingTransferFragment),
    modalScreen('Accounts', AccountsFragment),
    <Stack.Screen
        key={`genericScreen-App`}
        name={'App'}
        component={AppFragment}
        options={{ headerShown: false, headerBackVisible: false, gestureEnabled: false }}
    />
];

export const Navigation = React.memo(() => {
    const safeArea = useSafeAreaInsets();

    const recoilUpdater = useRecoilCallback<[any, any], any>(({ set }) => (node, value) => set(node, value));

    const engine = React.useMemo(() => {
        let state = getAppState();
        if (0 <= state.selected && state.selected < state.addresses.length) {
            const ex = state.addresses[state.selected];

            // Identify user profile by address
            mixpanel.identify(ex.address.toFriendly({ testOnly: AppConfig.isTestnet }));
            mixpanel.flush();

            return createEngine({ address: ex.address, publicKey: ex.publicKey, utilityKey: ex.utilityKey, recoilUpdater });
        } else {
            return null;
        }
    }, []);
    React.useEffect(() => {
        return () => {
            if (engine) {
                engine.destroy();
            }
        }
    }, []);

    const initial = React.useMemo(() => {
        const onboarding = resolveOnboarding(engine);

        if (onboarding === 'backup') {
            return 'WalletCreated';
        } else if (onboarding === 'home') {
            return 'Home';
        } else if (onboarding === 'sync') {
            return 'Sync';
        } else if (onboarding === 'welcome') {
            return 'Welcome';
        } else if (onboarding === 'upgrade-store') {
            return 'WalletUpgrade';
        } else {
            throw Error('Invalid onboarding state');
        }
    }, []);

    // Splash
    const [splashVisible, setSplashVisible] = React.useState(true);

    const splashOpacity = React.useMemo(() => {
        return new Animated.Value<number>(1);
    }, [splashVisible]);

    const onMounted = React.useMemo(() => {
        return () => {
            if (!splashVisible) {
                return;
            }
            Animated.timing(splashOpacity, {
                toValue: 0,
                duration: 350,
                easing: EasingNode.linear
            }).start((e) => {
                setSplashVisible(false);
            });
        }
    }, [splashVisible]);

    let splash = React.useMemo(() => (splashVisible && (
        <Animated.View
            key="splash"
            style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: splashOpacity as any,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: Theme.background,
            }}
            pointerEvents={'none'}
        >
            <View style={{
                width: 256, height: 416,
                alignItems: 'center',
            }}>
                <Image style={{
                    width: 256, height: 256,
                }} source={require('../assets/splash_icon.png')} />
            </View>
        </Animated.View>
    )), [splashVisible, safeArea]);

    // Register token
    React.useEffect(() => {
        const state = getAppState();
        let ended = false;
        (async () => {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            if (existingStatus === PermissionStatus.GRANTED || state.addresses.length > 0) {
                const token = await backoff('navigation', () => registerForPushNotificationsAsync());
                if (token) {
                    if (ended) {
                        return;
                    }
                    await backoff('navigation', async () => {
                        if (ended) {
                            return;
                        }
                        await registerPushToken(token, state.addresses.map((v) => v.address));
                    });
                }
            }
        })();
        return () => {
            ended = true;
        };
    }, []);

    // Grant accesses
    React.useEffect(() => {
        let ended = false;
        backoff('navigation', async () => {
            if (ended) {
                return;
            }
            const pending = getPendingGrant();
            for (let p of pending) {
                await axios.post('https://connect.tonhubapi.com/connect/grant', { key: p }, { timeout: 5000 });
                removePendingGrant(p);
            }
        })
        return () => {
            ended = true;
        };
    }, []);

    // Revoke accesses
    React.useEffect(() => {
        let ended = false;
        backoff('navigation', async () => {
            if (ended) {
                return;
            }
            const pending = getPendingRevoke();
            for (let p of pending) {
                await axios.post('https://connect.tonhubapi.com/connect/revoke', { key: p }, { timeout: 5000 });
                removePendingRevoke(p);
            }
        })
        return () => {
            ended = true;
        };
    }, []);

    return (
        <EngineContext.Provider value={engine}>
            <View style={{ flexGrow: 1, alignItems: 'stretch' }}>
                <NavigationContainer
                    theme={NavigationTheme}
                    onReady={onMounted}
                >
                    <Stack.Navigator
                        initialRouteName={initial}
                        screenOptions={{ headerBackTitle: t('common.back'), title: '', headerShadowVisible: false, headerTransparent: false, headerStyle: { backgroundColor: 'white' } }}
                    >
                        {navigation}
                    </Stack.Navigator>
                </NavigationContainer>
                {splash}
            </View>
        </EngineContext.Provider>
    );
});

export function useLinkNavigator() {
    const navigation = useTypedNavigation();

    const handler = React.useCallback((resolved: ResolvedUrl) => {
        if (resolved.type === 'transaction') {
            if (resolved.payload) {
                navigation.navigateTransfer({
                    order: {
                        target: resolved.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                        amount: resolved.amount || new BN(0),
                        amountAll: false,
                        stateInit: resolved.stateInit,
                        payload: resolved.payload,
                    },
                    text: resolved.comment,
                    job: null,
                    callback: null
                });
            } else {
                navigation.navigateSimpleTransfer({
                    target: resolved.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                    comment: resolved.comment,
                    amount: resolved.amount,
                    stateInit: resolved.stateInit,
                    job: null,
                    jetton: null,
                    callback: null
                });
            }
        }
        if (resolved.type === 'connect') {
            navigation.navigate('Authenticate', {
                session: resolved.session,
                endpoint: resolved.endpoint
            });
        }
        if (resolved.type === 'install') {
            navigation.navigate('Install', {
                url: resolved.url,
                title: resolved.customTitle,
                image: resolved.customImage
            });
        }
    }, []);

    return handler;
}