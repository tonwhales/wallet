import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { RecoilRoot } from 'recoil';
import { WelcomeFragment } from './fragments/WelcomeFragment';

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
                        />
                    </Stack.Navigator>
                </RecoilRoot>
            </View>
        </>
    );
});