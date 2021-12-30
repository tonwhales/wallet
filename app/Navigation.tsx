import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { RecoilRoot } from 'recoil';
import { WelcomeFragment } from './fragments/WelcomeFragment';
import { WalletImportFragment } from './fragments/WalletImportFragment';
import { WalletCreateFragment } from './fragments/WalletCreateFragment';

const Stack = createNativeStackNavigator();

export const Navigation = React.memo(() => {
    return (
        <>
            <View style={{ flexGrow: 1, alignItems: 'stretch' }}>
                <RecoilRoot>
                    <Stack.Navigator
                        initialRouteName="Welcome"
                        screenOptions={{ headerBackTitle: 'Back', title: '' }}
                    >
                        <Stack.Screen
                            name="Welcome"
                            component={WelcomeFragment}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="WalletImport"
                            component={WalletImportFragment}
                            options={{ headerShown: false }}
                        />
                         <Stack.Screen
                            name="WalletCreate"
                            component={WalletCreateFragment}
                            options={{ headerShown: false }}
                        />
                    </Stack.Navigator>
                </RecoilRoot>
            </View>
        </>
    );
});