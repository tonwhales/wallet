import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';
import { WelcomeFragment } from './fragments/onboarding/WelcomeFragment';
import { WalletImportFragment } from './fragments/onboarding/WalletImportFragment';
import { WalletCreateFragment } from './fragments/onboarding/WalletCreateFragment';
import { LegalFragment } from './fragments/onboarding/LegalFragment';
import { WalletBackupFragment } from './fragments/secure/WalletBackupFragment';
import { HomeFragment } from './fragments/HomeFragment';
import { SimpleTransferFragment } from './fragments/secure/SimpleTransferFragment';
import { ScannerFragment } from './fragments/utils/ScannerFragment';
import { MigrationFragment } from './fragments/secure/MigrationFragment';
import { ReceiveFragment } from './fragments/wallet/ReceiveFragment';
import { TransactionPreviewFragment } from './fragments/wallet/TransactionPreviewFragment';
import { PrivacyFragment } from './fragments/onboarding/PrivacyFragment';
import { TermsFragment } from './fragments/onboarding/TermsFragment';
import { resolveOnboarding } from './fragments/resolveOnboarding';
import { DeveloperToolsFragment } from './fragments/dev/DeveloperToolsFragment';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { getPendingGrant, getPendingRevoke, removePendingGrant, removePendingRevoke } from './storage/appState';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { backoff } from './utils/time';
import { t } from './i18n/t';
import { AuthenticateFragment } from './fragments/secure/dapps/AuthenticateFragment';
import axios from 'axios';
import { NeocryptoFragment } from './fragments/integrations/NeocryptoFragment';
import { StakingTransferFragment } from './fragments/staking/StakingTransferFragment';
import { SignFragment } from './fragments/secure/SignFragment';
import { TransferFragment } from './fragments/secure/TransferFragment';
import { AppFragment } from './fragments/apps/AppFragment';
import { DevStorageFragment } from './fragments/dev/DevStorageFragment';
import { WalletUpgradeFragment } from './fragments/secure/WalletUpgradeFragment';
import { InstallFragment } from './fragments/secure/dapps/InstallFragment';
import { SpamFilterFragment } from './fragments/SpamFilterFragment';
import { ReviewFragment } from './fragments/apps/ReviewFragment';
import { DeleteAccountFragment } from './fragments/DeleteAccountFragment';
import { LogoutFragment } from './fragments/LogoutFragment';
import { ContactFragment } from './fragments/contacts/ContactFragment';
import { ContactsFragment } from './fragments/contacts/ContactsFragment';
import { CurrencyFragment } from './fragments/CurrencyFragment';
import { StakingCalculatorFragment } from './fragments/staking/StakingCalculatorFragment';
import { TonConnectAuthenticateFragment } from './fragments/secure/dapps/TonConnectAuthenticateFragment';
import { Splash } from './components/Splash';
import { AssetsFragment } from './fragments/wallet/AssetsFragment';
import { ConnectAppFragment } from './fragments/apps/ConnectAppFragment';
import { PasscodeSetupFragment } from './fragments/secure/passcode/PasscodeSetupFragment';
import { SecurityFragment } from './fragments/SecurityFragment';
import { PasscodeChangeFragment } from './fragments/secure/passcode/PasscodeChangeFragment';
import { HoldersLandingFragment } from './fragments/holders/HoldersLandingFragment';
import { HoldersAppFragment } from './fragments/holders/HoldersAppFragment';
import { BiometricsSetupFragment } from './fragments/BiometricsSetupFragment';
import { KeyStoreMigrationFragment } from './fragments/secure/KeyStoreMigrationFragment';
import { useNetwork, useTheme } from './engine/hooks';
import { useNavigationTheme } from './engine/hooks';
import { useRecoilValue } from 'recoil';
import { appStateAtom } from './engine/state/appState';
import { useBlocksWatcher } from './engine/accountWatcher';
import { HintsPrefetcher } from './components/HintsPrefetcher';
import { useTonconnectWatcher } from './engine/tonconnectWatcher';
import { useHoldersWatcher } from './engine/holdersWatcher';
import { usePendingWatcher } from './engine/hooks';
import { registerForPushNotificationsAsync, registerPushToken } from './utils/registerPushNotifications';
import * as Notifications from 'expo-notifications';
import { PermissionStatus } from 'expo-modules-core';
import { warn } from './utils/log';
import { useIsRestoring } from '@tanstack/react-query';
import { ThemeFragment } from './fragments/ThemeFragment';
import { ScreenCaptureFragment } from './fragments/utils/ScreenCaptureFragment';
import { AlertFragment } from './fragments/utils/AlertFragment';
import { AccountSelectorFragment } from './fragments/wallet/AccountSelectorFragment';
import { memo, useEffect, useMemo, useState } from 'react';
import { WalletSettingsFragment } from './fragments/wallet/WalletSettingsFragment';
import { AvatarPickerFragment } from './fragments/wallet/AvatarPickerFragment';
import { StakingPoolSelectorFragment } from './fragments/staking/StakingPoolSelectorFragment';
import { StakingOperationsFragment } from './fragments/staking/StakingOperationsFragment';
import { StakingAnalyticsFragment } from './fragments/staking/StakingAnalyticsFragment';
import { HardwareWalletFragment } from './fragments/ledger/HardwareWalletFragment';
import { LedgerDeviceSelectionFragment } from './fragments/ledger/LedgerDeviceSelectionFragment';
import { LedgerSelectAccountFragment } from './fragments/ledger/LedgerSelectAccountFragment';
import { LedgerAppFragment } from './fragments/ledger/LedgerAppFragment';
import { LedgerSignTransferFragment } from './fragments/ledger/LedgerSignTransferFragment';
import { AppStartAuthFragment } from './fragments/AppStartAuthFragment';
import { BackupIntroFragment } from './fragments/onboarding/BackupIntroFragment';
import { ProductsFragment } from './fragments/wallet/ProductsFragment';
import { PendingTxPreviewFragment } from './fragments/wallet/PendingTxPreviewFragment';
import { DAppWebViewFragment } from './fragments/utils/DAppWebViewFragment';
import { DevDAppWebViewFragment } from './fragments/dev/DevDAppWebViewFragment';
import { NewAddressFormatFragment } from './fragments/NewAddressFormatFragment';
import { BounceableFormatAboutFragment } from './fragments/utils/BounceableFormatAboutFragment';
import { LiquidWithdrawActionFragment } from './fragments/staking/LiquidWithdrawActionFragment';
import { LiquidStakingTransferFragment } from './fragments/staking/LiquidStakingTransferFragment';
import { ContactNewFragment } from './fragments/contacts/ContactNewFragment';
import { SearchEngineFragment } from './fragments/SearchEngineFragment';

const Stack = createNativeStackNavigator();
Stack.Navigator.displayName = 'MainStack';

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
    const theme = useTheme();
    return (
        <Stack.Screen
            key={`modalScreen-${name}`}
            name={name}
            component={component}
            options={{
                presentation: 'modal',
                headerShown: false,
                contentStyle: Platform.select({
                    ios: {
                        borderTopEndRadius: 20, borderTopStartRadius: 20,
                        paddingBottom: (safeArea.bottom === 0 ? 24 : safeArea.bottom) + 16,
                        backgroundColor: theme.elevation
                    },
                    android: { backgroundColor: theme.backgroundPrimary }
                })
            }}
        />
    );
}

function lockedModalScreen(name: string, component: React.ComponentType<any>, safeArea: EdgeInsets) {
    const theme = useTheme();
    return (
        <Stack.Screen
            key={`modalScreen-${name}`}
            name={name}
            component={component}
            options={{
                presentation: 'modal',
                headerShown: false,
                gestureEnabled: false,
                contentStyle: Platform.select({
                    ios: {
                        borderTopEndRadius: 20, borderTopStartRadius: 20,
                        paddingBottom: safeArea.bottom + 16,
                        backgroundColor: theme.elevation
                    },
                    android: { backgroundColor: theme.backgroundPrimary }
                })
            }}
        />
    );
}

function transparentModalScreen(name: string, component: React.ComponentType<any>, safeArea: EdgeInsets) {
    const theme = useTheme();
    return (
        <Stack.Screen
            key={`modalScreen-${name}`}
            name={name}
            component={component}
            options={{
                presentation: 'modal',
                headerShown: false,
                contentStyle: { backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.backgroundPrimary },
            }}
        />
    );
}

const navigation = (safeArea: EdgeInsets) => [
    // Onboarding
    fullScreen('Welcome', WelcomeFragment),
    genericScreen('LegalCreate', LegalFragment, safeArea, true),
    genericScreen('LegalImport', LegalFragment, safeArea, true),
    genericScreen('WalletImport', WalletImportFragment, safeArea, true),
    genericScreen('WalletCreate', WalletCreateFragment, safeArea, true),
    genericScreen('WalletBackupInit', WalletBackupFragment, safeArea),
    genericScreen('WalletUpgrade', WalletUpgradeFragment, safeArea),
    genericScreen('BackupIntro', BackupIntroFragment, safeArea),
    modalScreen('Transaction', TransactionPreviewFragment, safeArea),
    modalScreen('PendingTransaction', PendingTxPreviewFragment, safeArea),
    modalScreen('Sign', SignFragment, safeArea),
    modalScreen('Migration', MigrationFragment, safeArea),

    // Dev
    genericScreen('DeveloperTools', DeveloperToolsFragment, safeArea, true, 0),
    genericScreen('DeveloperToolsStorage', DevStorageFragment, safeArea),
    genericScreen('DevDAppWebView', DevDAppWebViewFragment, safeArea, true, 0),

    modalScreen('PasscodeSetupInit', PasscodeSetupFragment, safeArea),
    modalScreen('KeyStoreMigration', KeyStoreMigrationFragment, safeArea),

    // Wallet
    fullScreen('Home', HomeFragment),
    modalScreen('SimpleTransfer', SimpleTransferFragment, safeArea),
    modalScreen('Transfer', TransferFragment, safeArea),
    modalScreen('Receive', ReceiveFragment, safeArea),
    lockedModalScreen('Buy', NeocryptoFragment, safeArea),
    modalScreen('Assets', AssetsFragment, safeArea),
    transparentModalScreen('Products', ProductsFragment, safeArea),

    // dApps
    modalScreen('TonConnectAuthenticate', TonConnectAuthenticateFragment, safeArea),
    modalScreen('Install', InstallFragment, safeArea),
    modalScreen('Authenticate', AuthenticateFragment, safeArea),
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

    // Logout
    modalScreen('DeleteAccount', DeleteAccountFragment, safeArea),
    modalScreen('Logout', LogoutFragment, safeArea),
    modalScreen('WalletBackupLogout', WalletBackupFragment, safeArea),

    // Staking
    modalScreen('StakingTransfer', StakingTransferFragment, safeArea),
    modalScreen('LiquidStakingTransfer', LiquidStakingTransferFragment, safeArea),
    modalScreen('StakingCalculator', StakingCalculatorFragment, safeArea),
    transparentModalScreen('StakingPoolSelector', StakingPoolSelectorFragment, safeArea),
    transparentModalScreen('StakingPoolSelectorLedger', StakingPoolSelectorFragment, safeArea),
    modalScreen('StakingOperations', StakingOperationsFragment, safeArea),
    modalScreen('StakingAnalytics', StakingAnalyticsFragment, safeArea),
    transparentModalScreen('LiquidWithdrawAction', LiquidWithdrawActionFragment, safeArea),

    // Ledger
    modalScreen('Ledger', HardwareWalletFragment, safeArea),
    lockedModalScreen('LedgerDeviceSelection', LedgerDeviceSelectionFragment, safeArea),
    lockedModalScreen('LedgerSelectAccount', LedgerSelectAccountFragment, safeArea),
    fullScreen('LedgerApp', LedgerAppFragment),
    modalScreen('LedgerSimpleTransfer', SimpleTransferFragment, safeArea),
    modalScreen('LedgerReceive', ReceiveFragment, safeArea),
    lockedModalScreen('LedgerSignTransfer', LedgerSignTransferFragment, safeArea),
    modalScreen('LedgerTransactionPreview', TransactionPreviewFragment, safeArea),
    modalScreen('LedgerAssets', AssetsFragment, safeArea),
    modalScreen('LedgerStakingTransfer', StakingTransferFragment, safeArea),
    modalScreen('LedgerLiquidStakingTransfer', LiquidStakingTransferFragment, safeArea),
    modalScreen('LedgerStakingCalculator', StakingCalculatorFragment, safeArea),

    // Settings
    modalScreen('WalletBackup', WalletBackupFragment, safeArea),
    modalScreen('Security', SecurityFragment, safeArea),
    modalScreen('Contacts', ContactsFragment, safeArea),
    modalScreen('Contact', ContactFragment, safeArea),
    modalScreen('ContactNew', ContactNewFragment, safeArea),
    modalScreen('SpamFilter', SpamFilterFragment, safeArea),
    modalScreen('Currency', CurrencyFragment, safeArea),
    modalScreen('Theme', ThemeFragment, safeArea),
    modalScreen('PasscodeSetup', PasscodeSetupFragment, safeArea),
    modalScreen('PasscodeChange', PasscodeChangeFragment, safeArea),
    modalScreen('BiometricsSetup', BiometricsSetupFragment, safeArea),
    modalScreen('WalletSettings', WalletSettingsFragment, safeArea),
    modalScreen('AvatarPicker', AvatarPickerFragment, safeArea),
    modalScreen('NewAddressFormat', NewAddressFormatFragment, safeArea),
    modalScreen('BounceableFormatAbout', BounceableFormatAboutFragment, safeArea),
    modalScreen('SearchEngine', SearchEngineFragment, safeArea),

    // Holders
    genericScreen('HoldersLanding', HoldersLandingFragment, safeArea, true, 0),
    genericScreen('Holders', HoldersAppFragment, safeArea, true, 0),

    // Utils
    genericScreen('Privacy', PrivacyFragment, safeArea, true),
    genericScreen('Terms', TermsFragment, safeArea, true),
    lockedModalScreen('Scanner', ScannerFragment, safeArea),
    transparentModalScreen('Alert', AlertFragment, safeArea),
    transparentModalScreen('ScreenCapture', ScreenCaptureFragment, safeArea),
    transparentModalScreen('AccountSelector', AccountSelectorFragment, safeArea),
    fullScreen('AppStartAuth', AppStartAuthFragment),
    genericScreen('DAppWebView', DAppWebViewFragment, safeArea, true, 0),
];

export const navigationRef = createNavigationContainerRef<any>();

export const Navigation = memo(() => {
    const safeArea = useSafeAreaInsets();
    const navigationTheme = useNavigationTheme();
    const appState = useRecoilValue(appStateAtom);
    const { isTestnet } = useNetwork();

    const initial = useMemo(() => {
        return resolveOnboarding(isTestnet, true);
    }, []);

    // Splash
    const [mounted, setMounted] = useState(false);
    const isRestoring = useIsRestoring();
    const onMounted = useMemo(() => {
        return () => {
            if (mounted) {
                return;
            }
            setMounted(true);
        }
    }, [mounted]);
    const hideSplash = mounted && !isRestoring;

    // Register token
    useEffect(() => {
        let ended = false;
        (async () => {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            if (existingStatus === PermissionStatus.GRANTED || appState.addresses.length > 0) {
                const token = await backoff('navigation', async () => {
                    try {
                        return await registerForPushNotificationsAsync();
                    } catch (e) {
                        if (e instanceof Error && e.message.includes(`Notification registration failed: "Push Notifications" capability hasn't been added`)) {
                            warn('[push-notifications] Push notifications are not enabled in this build');
                            return null;
                        }
                        throw e;
                    }
                });
                if (token) {
                    if (ended) {
                        return;
                    }
                    await backoff('navigation', async () => {
                        if (ended) {
                            return;
                        }
                        await registerPushToken(token, appState.addresses.map((v) => v.address), isTestnet);
                    });
                }
            }
        })();
        return () => {
            ended = true;
        };
    }, [appState]);

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

    // Watch blocks
    useBlocksWatcher();

    // Watch for TonConnect requests
    useTonconnectWatcher();

    // Watch for holders updates
    useHoldersWatcher();

    // clear pending txs on account change
    usePendingWatcher();

    return (
        <View style={{ flexGrow: 1, alignItems: 'stretch', backgroundColor: navigationTheme.colors.background }}>
            <NavigationContainer
                theme={navigationTheme}
                onReady={onMounted}
                ref={navigationRef}
            >
                <Stack.Navigator
                    initialRouteName={initial}
                    screenOptions={{
                        headerBackTitle: t('common.back'),
                        title: '',
                        headerShadowVisible: false,
                        headerTransparent: false,
                        headerStyle: { backgroundColor: navigationTheme.colors.background }
                    }}
                >
                    {navigation(safeArea)}
                </Stack.Navigator>
            </NavigationContainer>
            <HintsPrefetcher />
            <Splash hide={hideSplash} />
        </View>
    );
});

