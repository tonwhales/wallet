import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';
import { RecoilRoot } from 'recoil';
import { WelcomeFragment } from './fragments/onboarding/WelcomeFragment';
import { WalletImportFragment } from './fragments/onboarding/WalletImportFragment';
import { WalletCreateFragment } from './fragments/onboarding/WalletCreateFragment';
import { LegalFragment } from './fragments/onboarding/LegalFragment';
import { WalletCreatedFragment } from './fragments/onboarding/WalletCreatedFragment';
import { WalletBackupFragment } from './fragments/wallet/WalletBackupFragment';
import { HomeFragment } from './fragments/HomeFragment';
import { TransferFragment } from './fragments/wallet/TransferFragment';
import { SettingsFragment } from './fragments/SettingsFragment';
import { ScannerFragment } from './fragments/utils/ScannerFragment';
import { MigrationFragment } from './fragments/wallet/MigrationFragment';
import { SyncFragment } from './fragments/onboarding/SyncFragment';
import { resolveOnboarding } from './storage/resolveOnboarding';

const Stack = createNativeStackNavigator();// Platform.OS === 'ios' ? createNativeStackNavigator() : createStackNavigator();

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


function fullScreenModal(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            key={`fullScreenModal-${name}`}
            name={name}
            component={component}
            options={{ headerShown: false, presentation: 'modal' }}
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
    fullScreenModal('Transfer', TransferFragment),
    genericScreen('Migration', MigrationFragment),
    fullScreenModal('Scanner', ScannerFragment)
];

export const Navigation = React.memo(() => {

    const initial = React.useMemo(() => {
        const onboarding = resolveOnboarding();
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

    return (
        <View style={{ flexGrow: 1, alignItems: 'stretch' }}>
            <RecoilRoot>
                <Stack.Navigator
                    initialRouteName={initial}
                    screenOptions={{ headerBackTitle: 'Back', title: '', headerShadowVisible: false, headerTransparent: false, headerStyle: { backgroundColor: 'white' }, }}
                >
                    {navigation}
                </Stack.Navigator>
            </RecoilRoot>
        </View>
    );
});