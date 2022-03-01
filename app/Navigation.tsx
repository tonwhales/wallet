import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View, Image, Text } from 'react-native';
import { WelcomeFragment } from './fragments/onboarding/WelcomeFragment';
import { WalletImportFragment } from './fragments/onboarding/WalletImportFragment';
import { WalletCreateFragment } from './fragments/onboarding/WalletCreateFragment';
import { LegalFragment } from './fragments/onboarding/LegalFragment';
import { WalletCreatedFragment } from './fragments/onboarding/WalletCreatedFragment';
import { WalletBackupFragment } from './fragments/secure/WalletBackupFragment';
import { HomeFragment } from './fragments/HomeFragment';
import { TransferFragment } from './fragments/secure/TransferFragment';
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
import { NavigationTheme } from './Theme';
import { getAppState } from './storage/appState';
import { Engine, EngineContext } from './sync/Engine';
import { storageCache } from './storage/storage';
import { createSimpleConnector } from './sync/Connector';
import { AppConfig } from './AppConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { EasingNode } from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { backoff } from './utils/time';
import { registerForPushNotificationsAsync, registerPushToken } from './utils/registerPushNotifications';
import * as Notifications from 'expo-notifications';
import { PermissionStatus } from 'expo-modules-core';
import { t } from './i18n/t';
import { useNavigationReady } from './utils/NavigationReadyContext';
import { ShareTransactionFragment } from './fragments/wallet/ShareTransactionFragment';

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

function shortScreenModal(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            key={`fullScreenModal-${name}`}
            name={name}
            component={component}
            options={{
                presentation: 'modal',
                headerShown: false,
                contentStyle: {
                    marginTop: '25%',
                    borderTopRightRadius: 14,
                    borderTopLeftRadius: 14
                },
            }}
        />
    );
}

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
    genericScreen('Settings', SettingsFragment),
    genericScreen('Privacy', PrivacyFragment),
    genericScreen('Terms', TermsFragment),
    modalScreen('Transfer', TransferFragment),
    modalScreen('Receive', ReceiveFragment),
    modalScreen('Transaction', TransactionPreviewFragment),
    modalScreen('Migration', MigrationFragment),
    shortScreenModal('ShareTransaction', ShareTransactionFragment),
    lockedModalScreen('Scanner', ScannerFragment),
    genericScreen('DeveloperTools', DeveloperToolsFragment)
];

export const Navigation = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const navState: {
        ready: boolean,
        setReady: (value: boolean) => void
    } | undefined = useNavigationReady();

    const engine = React.useMemo(() => {
        let state = getAppState();
        if (0 <= state.selected && state.selected < state.addresses.length) {
            const ex = state.addresses[state.selected];
            return new Engine(
                ex.address,
                ex.publicKey,
                storageCache,
                createSimpleConnector(!AppConfig.isTestnet ? {
                    main: 'https://mainnet.tonhubapi.com',
                    estimate: 'https://connect.tonhubapi.com/estimate',
                    sender: 'https://connect.tonhubapi.com/send',
                } : {
                    main: 'https://testnet.tonhubapi.com',
                    estimate: 'https://connect.tonhubapi.com/estimate',
                    sender: 'https://connect.tonhubapi.com/send',
                })
            );
        } else {
            return null;
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
        } else {
            throw Error('Invalid onboarding state');
        }
    }, []);

    // Splash
    const [splashVisible, setSplashVisible] = React.useState(true);

    const splashOpacity = React.useMemo(() => {
        return new Animated.Value(1);
    }, [splashVisible]);

    const onMounted = React.useMemo(() => {
        return () => {
            if (!splashVisible) {
                SplashScreen.hideAsync();
                return;
            }
            Animated.timing(splashOpacity,
                {
                    toValue: 0,
                    duration: 200,
                    easing: EasingNode.ease
                }).start(() => {
                    setSplashVisible(false);
                });
            setTimeout(() => {
                SplashScreen.hideAsync();
            }, 30);
        }
    }, [splashVisible]);

    let splash = React.useMemo(() => (splashVisible && (
        <Animated.View
            key="splash"
            style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: splashOpacity,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'white',
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
                const token = await backoff(() => registerForPushNotificationsAsync());
                if (token) {
                    if (ended) {
                        return;
                    }
                    await backoff(async () => {
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

    React.useEffect(() => {
        if (navState?.ready) {
            onMounted();
        }
    }, [navState?.ready, onMounted]);

    return (
        <EngineContext.Provider value={engine}>
            <View style={{ flexGrow: 1, alignItems: 'stretch' }}>
                <NavigationContainer
                    theme={NavigationTheme}
                    onReady={() => navState?.setReady(true)}
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