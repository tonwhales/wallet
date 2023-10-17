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
import { SyncFragment } from './fragments/SyncFragment';
import { resolveOnboarding } from './fragments/resolveOnboarding';
import { DeveloperToolsFragment } from './fragments/dev/DeveloperToolsFragment';
import { NavigationContainer } from '@react-navigation/native';
import { getPendingGrant, getPendingRevoke, removePendingGrant, removePendingRevoke } from './storage/appState';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { backoff } from './utils/time';
import { t } from './i18n/t';
import { AuthenticateFragment } from './fragments/secure/AuthenticateFragment';
import { ConnectionsFragment } from './fragments/connections/ConnectionsFragment';
import axios from 'axios';
import { NeocryptoFragment } from './fragments/integrations/NeocryptoFragment';
import { StakingTransferFragment } from './fragments/staking/StakingTransferFragment';
import { StakingFragment } from './fragments/staking/StakingFragment';
import { SignFragment } from './fragments/secure/SignFragment';
import { TransferFragment } from './fragments/secure/TransferFragment';
import { AppFragment } from './fragments/apps/AppFragment';
import { DevStorageFragment } from './fragments/dev/DevStorageFragment';
import { WalletUpgradeFragment } from './fragments/secure/WalletUpgradeFragment';
import { InstallFragment } from './fragments/secure/InstallFragment';
import { StakingPoolsFragment } from './fragments/staking/StakingPoolsFragment';
import { AccountsFragment } from './fragments/AccountsFragment';
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
import { LedgerRoot } from './fragments/ledger/LedgerRoot';
import { TonConnectAuthenticateFragment } from './fragments/secure/TonConnectAuthenticateFragment';
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
import { useNetwork } from './engine/hooks/useNetwork';
import { useNavigationTheme } from './engine/hooks/useNavigationTheme';
import { useRecoilValue } from 'recoil';
import { appStateAtom } from './engine/state/appState';
import { useBlocksWatcher } from './engine/accountWatcher';
import { HintsPrefetcher } from './components/HintsPrefetcher';
import { useTonconnectWatcher } from './engine/tonconnectWatcher';
import { useHoldersWatcher } from './engine/holdersWatcher';

const Stack = createNativeStackNavigator();

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

function genericScreen(name: string, component: React.ComponentType<any>, safeArea: EdgeInsets) {
    return (
        <Stack.Screen
            key={`genericScreen-${name}`}
            name={name}
            component={component}
            options={{
                headerShown: Platform.OS === 'ios',
                contentStyle: { paddingBottom: Platform.OS === 'ios' ? safeArea.bottom + 16 : undefined }
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
    fullScreen('Sync', SyncFragment),
    genericScreen('LegalCreate', LegalFragment, safeArea),
    genericScreen('LegalImport', LegalFragment, safeArea),
    genericScreen('WalletImport', WalletImportFragment, safeArea),
    genericScreen('WalletCreate', WalletCreateFragment, safeArea),
    genericScreen('WalletCreated', WalletCreatedFragment, safeArea),
    genericScreen('WalletBackupInit', WalletBackupFragment, safeArea),
    genericScreen('WalletBackup', WalletBackupFragment, safeArea),
    genericScreen('WalletUpgrade', WalletUpgradeFragment, safeArea),
    genericScreen('Settings', SettingsFragment, safeArea),
    genericScreen('Privacy', PrivacyFragment, safeArea),
    genericScreen('Terms', TermsFragment, safeArea),
    modalScreen('Connections', ConnectionsFragment, safeArea),
    modalScreen('Transfer', TransferFragment, safeArea),
    modalScreen('SimpleTransfer', SimpleTransferFragment, safeArea),
    modalScreen('Receive', ReceiveFragment, safeArea),
    modalScreen('Transaction', TransactionPreviewFragment, safeArea),
    modalScreen('Authenticate', AuthenticateFragment, safeArea),
    modalScreen('TonConnectAuthenticate', TonConnectAuthenticateFragment, safeArea),
    modalScreen('Install', InstallFragment, safeArea),
    modalScreen('Sign', SignFragment, safeArea),
    modalScreen('Migration', MigrationFragment, safeArea),
    lockedModalScreen('Scanner', ScannerFragment, safeArea),
    genericScreen('DeveloperTools', DeveloperToolsFragment, safeArea),
    genericScreen('DeveloperToolsStorage', DevStorageFragment, safeArea),
    lockedModalScreen('Buy', NeocryptoFragment, safeArea),
    fullScreen('Staking', StakingFragment),
    fullScreen('StakingPools', StakingPoolsFragment),
    modalScreen('StakingGraph', StakingGraphFragment, safeArea),
    modalScreen('AccountBalanceGraph', AccountBalanceGraphFragment, safeArea),
    modalScreen('StakingTransfer', StakingTransferFragment, safeArea),
    modalScreen('Accounts', AccountsFragment, safeArea),
    modalScreen('SpamFilter', SpamFilterFragment, safeArea),
    modalScreen('Currency', CurrencyFragment, safeArea),
    modalScreen('Review', ReviewFragment, safeArea),
    modalScreen('DeleteAccount', DeleteAccountFragment, safeArea),
    modalScreen('Logout', LogoutFragment, safeArea),
    modalScreen('Contact', ContactFragment, safeArea),
    modalScreen('Contacts', ContactsFragment, safeArea),
    modalScreen('Ledger', LedgerRoot, safeArea),
    modalScreen('StakingCalculator', StakingCalculatorFragment, safeArea),
    modalScreen('HoldersLanding', HoldersLandingFragment, safeArea),
    lockedModalScreen('Holders', HoldersAppFragment, safeArea),
    modalScreen('Assets', AssetsFragment, safeArea),
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
    modalScreen('Security', SecurityFragment, safeArea),
    modalScreen('PasscodeSetup', PasscodeSetupFragment, safeArea),
    modalScreen('PasscodeSetupInit', PasscodeSetupFragment, safeArea),
    modalScreen('PasscodeChange', PasscodeChangeFragment, safeArea),
    modalScreen('BiometricsSetup', BiometricsSetupFragment, safeArea),
    modalScreen('KeyStoreMigration', KeyStoreMigrationFragment, safeArea),
];

export const Navigation = React.memo(() => {
    const safeArea = useSafeAreaInsets();
    const navigationTheme = useNavigationTheme();
    const appState = useRecoilValue(appStateAtom);
    const { isTestnet } = useNetwork();

    const initial = React.useMemo(() => {
        const onboarding = resolveOnboarding(isTestnet);

        if (onboarding === 'backup') {
            return 'WalletCreated';
        } else if (onboarding === 'home') {
            return 'Home';
        } else if (onboarding === 'welcome') {
            return 'Welcome';
        } else if (onboarding === 'upgrade-store') {
            return 'WalletUpgrade';
        } else if (onboarding === 'passcode-setup') {
            return 'PasscodeSetupInit';
        } else if (onboarding === 'android-key-store-migration') {
            return 'KeyStoreMigration';
        } else {
            throw Error('Invalid onboarding state');
        }
    }, []);

    // Splash
    const [hideSplash, setHideSplash] = React.useState(false);
    const onMounted = React.useMemo(() => {
        return () => {
            if (hideSplash) {
                return;
            }
            setHideSplash(true);
        }
    }, [hideSplash]);

    // Register token
    React.useEffect(() => {
        let ended = false;
        (async () => {
            // const { status: existingStatus } = await Notifications.getPermissionsAsync();
            // if (existingStatus === PermissionStatus.GRANTED || appState.addresses.length > 0) {
            //     const token = await backoff('navigation', () => registerForPushNotificationsAsync());
            //     if (token) {
            //         if (ended) {
            //             return;
            //         }
            //         await backoff('navigation', async () => {
            //             if (ended) {
            //                 return;
            //             }
            //             await registerPushToken(token, appState.addresses.map((v) => v.address), isTestnet);
            //         });
            //     }
            // }
        })();
        return () => {
            ended = true;
        };
    }, [appState]);

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

    // Watch blocks
    useBlocksWatcher();

    // Watch for TonConnect requests
    useTonconnectWatcher();

    // Watch for holders updates
    useHoldersWatcher();

    return (
        <View style={{ flexGrow: 1, alignItems: 'stretch' }}>
            <NavigationContainer
                theme={navigationTheme}
                onReady={onMounted}
            >
                <Stack.Navigator
                    initialRouteName={initial}
                    screenOptions={{
                        headerBackTitle: t('common.back'),
                        title: '',
                        headerShadowVisible: false,
                        headerTransparent: false,
                        headerStyle: { backgroundColor: 'white' }
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

