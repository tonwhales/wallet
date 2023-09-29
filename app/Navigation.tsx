import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';
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
import { resolveOnboarding } from './fragments/resolveOnboarding';
import { DeveloperToolsFragment } from './fragments/dev/DeveloperToolsFragment';
import { NavigationContainer } from '@react-navigation/native';
import { getAppState, getPendingGrant, getPendingRevoke, removePendingGrant, removePendingRevoke } from './storage/appState';
import { useEngine } from './engine/Engine';
import { backoff } from './utils/time';
import { registerForPushNotificationsAsync, registerPushToken } from './utils/registerPushNotifications';
import * as Notifications from 'expo-notifications';
import { PermissionStatus } from 'expo-modules-core';
import { t } from './i18n/t';
import { AuthenticateFragment } from './fragments/secure/dapps/AuthenticateFragment';
import axios from 'axios';
import { NeocryptoFragment } from './fragments/integrations/NeocryptoFragment';
import { StakingTransferFragment } from './fragments/staking/StakingTransferFragment';
import { StakingFragment } from './fragments/staking/StakingFragment';
import { SignFragment } from './fragments/secure/SignFragment';
import { TransferFragment } from './fragments/secure/TransferFragment';
import { AppFragment } from './fragments/apps/AppFragment';
import { DevStorageFragment } from './fragments/dev/DevStorageFragment';
import { WalletUpgradeFragment } from './fragments/secure/WalletUpgradeFragment';
import { InstallFragment } from './fragments/secure/dapps/InstallFragment';
import { StakingPoolsFragment } from './fragments/staking/StakingPoolsFragment';
import { SpamFilterFragment } from './fragments/SpamFilterFragment';
import { ReviewFragment } from './fragments/apps/ReviewFragment';
import { DeleteAccountFragment } from './fragments/DeleteAccountFragment';
import { LogoutFragment } from './fragments/LogoutFragment';
import { ContactFragment } from './fragments/ContactFragment';
import { ContactsFragment } from './fragments/ContactsFragment';
import { CurrencyFragment } from './fragments/CurrencyFragment';
import { StakingGraphFragment } from './fragments/staking/StakingGraphFragment';
import { AccountBalanceGraphFragment } from './fragments/wallet/AccountBalanceGraphFragment';
import { StakingCalculatorFragment } from './fragments/staking/StakingCalculatorFragment';
import { TonConnectAuthenticateFragment } from './fragments/secure/dapps/TonConnectAuthenticateFragment';
import { Splash } from './components/Splash';
import { AssetsFragment } from './fragments/wallet/AssetsFragment';
import { ConnectAppFragment } from './fragments/apps/ConnectAppFragment';
import { PasscodeSetupFragment } from './fragments/secure/passcode/PasscodeSetupFragment';
import { SecurityFragment } from './fragments/SecurityFragment';
import { PasscodeChangeFragment } from './fragments/secure/passcode/PasscodeChangeFragment';
import { useAppConfig } from './utils/AppConfigContext';
import { HoldersLandingFragment } from './fragments/holders/HoldersLandingFragment';
import { HoldersAppFragment } from './fragments/holders/HoldersAppFragment';
import { BiometricsSetupFragment } from './fragments/BiometricsSetupFragment';
import { WalletSettingsFragment } from './fragments/wallet/WalletSettingsFragment';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetProvider } from './components/modal/BottomSheetModal';
import { AvatarPickerFragment } from './fragments/wallet/AvatarPickerFragment';
import { HardwareWalletFragment } from './fragments/ledger/HardwareWalletFragment';
import { LedgerAppFragment } from './fragments/ledger/LedgerAppFragment';
import { LedgerSignTransferFragment } from './fragments/ledger/LedgerSignTransferFragment';
import { LedgerTransactionPreviewFragment } from './fragments/ledger/LedgerTransactionPreviewFragment';
import { LedgerDeviceSelectionFragment } from './fragments/ledger/LedgerDeviceSelectionFragment';
import { LedgerSelectAccountFragment } from './fragments/ledger/LedgerSelectAccountFragment';
import { AppStartAuthFragment } from './fragments/AppStartAuthFragment';
import { AccountSelectorFragment } from './fragments/wallet/AccountSelectorFragment';
import { memo, useEffect, useMemo, useState } from 'react';
import { ScreenCaptureFragment } from './fragments/utils/ScreenCaptureFragment';
import { StakingPoolSelectorFragment } from './fragments/staking/StakingPoolSelectorFragment';
import { StakingOperationsFragment } from './fragments/staking/StakingOperationsFragment';
import { StakingAnalyticsFragment } from './fragments/staking/StakingAnalyticsFragment';
import { ThemeFragment } from './fragments/ThemeFragment';
import { AlertFragment } from './fragments/utils/AlertFragment';

const Stack = createNativeStackNavigator();

export function fullScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            key={`fullScreen-${name}`}
            name={name}
            component={component}
            options={{ headerShown: false }}
        />
    );
}

export function genericScreen(name: string, component: React.ComponentType<any>, safeArea: EdgeInsets, hideHeader?: boolean, paddingBottom?: number) {
    return (
        <Stack.Screen
            key={`genericScreen-${name}`}
            name={name}
            component={component}
            options={{
                headerShown: hideHeader ? false : Platform.OS === 'ios',
                contentStyle: { paddingBottom: paddingBottom ?? (Platform.OS === 'ios' ? safeArea.bottom + 16 : undefined) }
            }}
        />
    );
}

function modalScreen(name: string, component: React.ComponentType<any>, safeArea: EdgeInsets) {
    return (
        <Stack.Screen
            key={`modalScreen-${name}`}
            name={name}
            component={component}
            options={{
                presentation: 'modal',
                headerShown: false,
                contentStyle: { paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom === 0 ? 24 : safeArea.bottom) + 16 : undefined }
            }}
        />
    );
}

function transparentModalScreen(name: string, component: React.ComponentType<any>, safeArea: EdgeInsets) {
    return (
        <Stack.Screen
            key={`modalScreen-${name}`}
            name={name}
            component={component}
            options={{
                presentation: 'modal',
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
            }}
        />
    );
}

function lockedModalScreen(name: string, component: React.ComponentType<any>, safeArea: EdgeInsets) {
    return (
        <Stack.Screen
            key={`modalScreen-${name}`}
            name={name}
            component={component}
            options={{
                presentation: 'modal',
                headerShown: false,
                gestureEnabled: false,
                contentStyle: { paddingBottom: Platform.OS === 'ios' ? safeArea.bottom + 16 : undefined }
            }}
        />
    );
}

const navigation = (safeArea: EdgeInsets) => [
    fullScreen('Welcome', WelcomeFragment),
    fullScreen('Home', HomeFragment),
    genericScreen('LegalCreate', LegalFragment, safeArea),
    genericScreen('LegalImport', LegalFragment, safeArea),
    genericScreen('WalletImport', WalletImportFragment, safeArea),
    genericScreen('WalletCreate', WalletCreateFragment, safeArea),
    genericScreen('WalletCreated', WalletCreatedFragment, safeArea),
    genericScreen('WalletBackupInit', WalletBackupFragment, safeArea),
    modalScreen('WalletBackup', WalletBackupFragment, safeArea),
    genericScreen('WalletUpgrade', WalletUpgradeFragment, safeArea),
    genericScreen('Settings', SettingsFragment, safeArea),
    genericScreen('Privacy', PrivacyFragment, safeArea, undefined, 0),
    genericScreen('Terms', TermsFragment, safeArea, undefined, 0),
    modalScreen('Transfer', TransferFragment, safeArea),
    modalScreen('SimpleTransfer', SimpleTransferFragment, safeArea),
    modalScreen('Receive', ReceiveFragment, safeArea),
    modalScreen('Transaction', TransactionPreviewFragment, safeArea),
    modalScreen('Authenticate', AuthenticateFragment, safeArea),
    modalScreen('Sign', SignFragment, safeArea),
    lockedModalScreen('Buy', NeocryptoFragment, safeArea),
    modalScreen('AccountBalanceGraph', AccountBalanceGraphFragment, safeArea),
    modalScreen('Assets', AssetsFragment, safeArea),

    // dApps
    transparentModalScreen('TonConnectAuthenticate', TonConnectAuthenticateFragment, safeArea),
    modalScreen('Install', InstallFragment, safeArea),
    <Stack.Screen
        key={`genericScreen-App`}
        name={'App'}
        component={AppFragment}
        options={{ headerShown: false, headerBackVisible: false, gestureEnabled: false }}
    />,
    <Stack.Screen
        key={`genericScreen-connect-App`}
        name={'ConnectApp'}
        component={ConnectAppFragment}
        options={{ headerShown: false, headerBackVisible: false, gestureEnabled: false }}
    />,
    modalScreen('Review', ReviewFragment, safeArea),


    // Settings
    modalScreen('Migration', MigrationFragment, safeArea),
    modalScreen('PasscodeSetup', PasscodeSetupFragment, safeArea),
    modalScreen('PasscodeSetupInit', PasscodeSetupFragment, safeArea),
    modalScreen('PasscodeChange', PasscodeChangeFragment, safeArea),
    modalScreen('BiometricsSetup', BiometricsSetupFragment, safeArea),
    modalScreen('WalletSettings', WalletSettingsFragment, safeArea),
    modalScreen('AvatarPicker', AvatarPickerFragment, safeArea),

    // Staking
    modalScreen('StakingGraph', StakingGraphFragment, safeArea),
    modalScreen('StakingTransfer', StakingTransferFragment, safeArea),
    modalScreen('StakingCalculator', StakingCalculatorFragment, safeArea),
    transparentModalScreen('StakingPoolSelector', StakingPoolSelectorFragment, safeArea),
    transparentModalScreen('StakingPoolSelectorLedger', StakingPoolSelectorFragment, safeArea),
    modalScreen('StakingOperations', StakingOperationsFragment, safeArea),
    modalScreen('StakingAnalytics', StakingAnalyticsFragment, safeArea),

    // Settings
    modalScreen('Security', SecurityFragment, safeArea),
    modalScreen('Contacts', ContactsFragment, safeArea),
    modalScreen('Contact', ContactFragment, safeArea),
    modalScreen('SpamFilter', SpamFilterFragment, safeArea),
    modalScreen('Currency', CurrencyFragment, safeArea),
    modalScreen('Theme', ThemeFragment, safeArea),

    // Ledger
    modalScreen('Ledger', HardwareWalletFragment, safeArea),
    lockedModalScreen('LedgerDeviceSelection', LedgerDeviceSelectionFragment, safeArea),
    lockedModalScreen('LedgerSelectAccount', LedgerSelectAccountFragment, safeArea),
    fullScreen('LedgerApp', LedgerAppFragment),
    modalScreen('LedgerSimpleTransfer', SimpleTransferFragment, safeArea),
    modalScreen('LedgerReceive', ReceiveFragment, safeArea),
    lockedModalScreen('LedgerSignTransfer', LedgerSignTransferFragment, safeArea),
    modalScreen('LedgerTransactionPreview', LedgerTransactionPreviewFragment, safeArea),
    modalScreen('LedgerAssets', AssetsFragment, safeArea),
    modalScreen('LedgerStakingPools', StakingPoolsFragment, safeArea),
    modalScreen('LedgerStaking', StakingFragment, safeArea),
    modalScreen('LedgerStakingTransfer', StakingTransferFragment, safeArea),
    modalScreen('LedgerStakingCalculator', StakingCalculatorFragment, safeArea),

    // Logout
    modalScreen('DeleteAccount', DeleteAccountFragment, safeArea),
    modalScreen('Logout', LogoutFragment, safeArea),
    modalScreen('WalletBackupLogout', WalletBackupFragment, safeArea),

    // Holders
    genericScreen('HoldersLanding', HoldersLandingFragment, safeArea, undefined, 0),
    genericScreen('Holders', HoldersAppFragment, safeArea, undefined, 0),

    // Utils
    transparentModalScreen('Alert', AlertFragment, safeArea),
    transparentModalScreen('ScreenCapture', ScreenCaptureFragment, safeArea),
    genericScreen('Scanner', ScannerFragment, safeArea, true, 0),
    fullScreen('AppStartAuth', AppStartAuthFragment),
    transparentModalScreen('AccountSelector', AccountSelectorFragment, safeArea),

    // Dev
    genericScreen('DeveloperTools', DeveloperToolsFragment, safeArea),
    genericScreen('DeveloperToolsStorage', DevStorageFragment, safeArea),
];

export const Navigation = memo(() => {
    const safeArea = useSafeAreaInsets();
    const { AppConfig, NavigationTheme, Theme } = useAppConfig();
    const engine = useEngine();

    const initial = useMemo(() => {
        const onboarding = resolveOnboarding(engine, AppConfig.isTestnet, true);
        return onboarding;
    }, []);

    // Splash
    const [hideSplash, setHideSplash] = useState(false);
    const onMounted = useMemo(() => {
        return () => {
            if (hideSplash) {
                return;
            }
            setHideSplash(true);
        }
    }, [hideSplash]);

    // Register token
    // TODO: register many tokens to subscribe to an array of addresses for pushes
    useEffect(() => {
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
                        await registerPushToken(token, state.addresses.map((v) => v.address), AppConfig.isTestnet);
                    });
                }
            }
        })();
        return () => {
            ended = true;
        };
    }, []);

    // Grant accesses
    useEffect(() => {
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
    useEffect(() => {
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
        <View style={{
            flexGrow: 1,
            alignItems: 'stretch',
        }}>
            <NavigationContainer
                theme={NavigationTheme}
                onReady={onMounted}
            >
                <BottomSheetProvider>
                    <Stack.Navigator
                        initialRouteName={initial}
                        screenOptions={{
                            headerBackTitle: t('common.back'),
                            title: '',
                            headerShadowVisible: false,
                            headerTransparent: false,
                            headerStyle: { backgroundColor: Theme.background }
                        }}
                    >
                        {navigation(safeArea)}
                    </Stack.Navigator>
                </BottomSheetProvider>
            </NavigationContainer>
            <Splash hide={hideSplash} />
        </View>
    );
});
