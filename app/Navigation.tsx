import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';
import { RecoilRoot } from 'recoil';
import { WelcomeFragment } from './fragments/onboarding/WelcomeFragment';
import { WalletImportFragment } from './fragments/onboarding/WalletImportFragment';
import { WalletCreateFragment } from './fragments/onboarding/WalletCreateFragment';
import { LegalFragment } from './fragments/onboarding/LegalFragment';
import { WalletCreatedFragment } from './fragments/onboarding/WalletCreatedFragment';
import { storage } from './utils/storage';
import { WalletBackupFragment } from './fragments/wallet/WalletBackupFragment';
import { HomeFragment } from './fragments/HomeFragment';
import { TransferFragment } from './fragments/wallet/TransferFragment';
import { SettingsFragment } from './fragments/SettingsFragment';
import { ScannerFragment } from './fragments/utils/ScannerFragment';

const Stack = createNativeStackNavigator();// Platform.OS === 'ios' ? createNativeStackNavigator() : createStackNavigator();

function fullScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            name={name}
            component={component}
            options={{ headerShown: false }}
        />
    );
}

function genericScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            name={name}
            component={component}
            options={{ headerShown: Platform.OS === 'ios' }}
        />
    );
}

function formSheetScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            name={name}
            component={component}
            options={{ headerShown: false }}
        />
    );
}


function fullScreenModal(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            name={name}
            component={component}
            options={{ headerShown: false, presentation: 'modal' }}
        />
    );
}

const navigation = [
    fullScreen('Welcome', WelcomeFragment),
    fullScreen('Home', HomeFragment),
    genericScreen('LegalCreate', LegalFragment),
    genericScreen('LegalImport', LegalFragment),
    genericScreen('WalletImport', WalletImportFragment),
    genericScreen('WalletCreate', WalletCreateFragment),
    genericScreen('WalletCreated', WalletCreatedFragment),
    genericScreen('WalletBackupInit', WalletBackupFragment),
    genericScreen('WalletBackup', WalletBackupFragment),
    genericScreen('Settings', SettingsFragment),
    genericScreen('Transfer', TransferFragment),
    fullScreenModal('Scanner', ScannerFragment)
];

export const Navigation = React.memo(() => {

    const initial = React.useMemo(() => {
        if (storage.getString('ton-mnemonics')) {
            if (storage.getBoolean('ton-backup-completed')) {
                return 'Home';
            } else {
                return 'WalletCreated';
            }
        } else {
            return 'Welcome';
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