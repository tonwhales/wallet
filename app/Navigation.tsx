import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
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
import { WalletReceiveFragment } from './fragments/wallet/WalletReceiveFragment';
import { SettingsFragment } from './fragments/SettingsFragment';
import { ScannerFragment } from './fragments/utils/ScannerFragment';

const Stack = createNativeStackNavigator();

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
        <>
            <View style={{ flexGrow: 1, alignItems: 'stretch' }}>
                <RecoilRoot>
                    <Stack.Navigator
                        initialRouteName={initial}
                        screenOptions={{ headerBackTitle: 'Back', title: '', headerShadowVisible: false }}
                    >
                        <Stack.Screen
                            name="Welcome"
                            component={WelcomeFragment}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="LegalCreate"
                            component={LegalFragment}
                        />
                        <Stack.Screen
                            name="LegalImport"
                            component={LegalFragment}
                        />
                        <Stack.Screen
                            name="WalletImport"
                            component={WalletImportFragment}
                        />
                        <Stack.Screen
                            name="WalletCreate"
                            component={WalletCreateFragment}
                        />
                        <Stack.Screen
                            name="WalletCreated"
                            component={WalletCreatedFragment}
                            options={{}}
                        />
                        <Stack.Screen
                            name="WalletBackupInit"
                            component={WalletBackupFragment}
                            options={{}}
                        />
                        <Stack.Screen
                            name="WalletBackup"
                            component={WalletBackupFragment}
                            options={{}}
                        />
                        <Stack.Screen
                            name="WalletReceive"
                            component={WalletReceiveFragment}
                            options={{ headerShown: false, presentation: 'formSheet' }}
                        />
                        <Stack.Screen
                            name="Home"
                            component={HomeFragment}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Transfer"
                            component={TransferFragment}
                            options={{ headerShown: false, presentation: 'formSheet' }}
                        />
                        <Stack.Screen
                            name="Scanner"
                            component={ScannerFragment}
                            options={{ headerShown: false, presentation: 'fullScreenModal' }}
                        />
                        <Stack.Screen
                            name="Settings"
                            component={SettingsFragment}
                            options={{ title: 'Settings' }}
                        />
                    </Stack.Navigator>
                </RecoilRoot>
            </View>
        </>
    );
});