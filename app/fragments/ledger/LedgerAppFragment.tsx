import React from "react";
import { useEffect } from "react";
import { View, Image } from "react-native";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LedgerHomeFragment } from "./LedgerHomeFragment";
import { useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "./components/TransportContext";
import { TransactionsFragment } from "../wallet/TransactionsFragment";

const Tab = createBottomTabNavigator();

export const LedgerAppFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();

    useEffect(() => {
        ledgerContext?.setFocused(true);
        return () => {
            ledgerContext?.setFocused(false);
        }
    }, []);

    if (
        !ledgerContext?.tonTransport
        || !ledgerContext.addr
    ) {
        navigation.navigateAndReplaceAll('Home')
        return null;
    }

    return (
        <View style={{ flexGrow: 1, backgroundColor: 'white', }}>
            <Tab.Navigator
                initialRouteName={'LedgerHome'}
                screenOptions={({ route }) => ({
                    tabBarStyle: {
                        backgroundColor: theme.surfacePimary,
                        borderTopColor: theme.border
                    },
                    tabBarActiveTintColor: theme.accent,
                    tabBarInactiveTintColor: theme.iconPrimary,
                    headerShown: false,
                    header: undefined,
                    unmountOnBlur: true,
                    tabBarIcon: ({ focused }) => {
                        let source = require('@assets/ic-home.png');

                        if (route.name === 'LedgerTransactions') {
                            source = require('@assets/ic-history.png');
                        }

                        return (
                            <Image
                                source={source}
                                style={{ tintColor: focused ? theme.accent : theme.iconPrimary, height: 24, width: 24 }}
                            />
                        )
                    }
                })}
            >
                <Tab.Screen
                    options={{ title: t('home.home') }}
                    name={'LedgerHome'}
                    component={LedgerHomeFragment}
                />
                <Tab.Screen
                    options={{ title: t('home.history') }}
                    name={'LedgerTransactions'}
                    component={TransactionsFragment}
                />
            </Tab.Navigator>
        </View>
    );
})
