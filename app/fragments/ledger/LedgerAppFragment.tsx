import React from "react";
import { useEffect } from "react";
import { View, Image, Platform, StyleSheet } from "react-native";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LedgerNavigationStack } from "./LedgerHomeFragment";
import { useAccountTransactions, useClient4, useNetwork, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "./components/TransportContext";
import { TransactionsFragment } from "../wallet/TransactionsFragment";
import { BlurView } from "expo-blur";
import { Address } from '@ton/core';

const Tab = createBottomTabNavigator();


const PrefetchTransactions = ({ address }: { address: string }) => {
    let isTestnet = useNetwork().isTestnet;
    let client = useClient4(isTestnet);

    useAccountTransactions(client, address);

    return null;
}

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
        <View style={{ flexGrow: 1, backgroundColor: theme.surfaceOnBg }}>
            {ledgerContext?.addr.address && <PrefetchTransactions address={ledgerContext?.addr.address} />}
            <Tab.Navigator
                initialRouteName={'LedgerHome'}
                screenOptions={({ route }) => ({
                    tabBarStyle: {
                        backgroundColor: theme.transparent,
                        borderTopColor: theme.border,
                        ...Platform.select({
                            ios: {
                                backgroundColor: theme.transparent,
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                            },
                            android: { backgroundColor: theme.surfaceOnBg }
                        })
                    },
                    tabBarBackground: Platform.OS === 'ios' ? () => {
                        return (
                            <BlurView
                                tint={theme.style === 'light' ? 'light' : 'dark'}
                                intensity={80}
                                style={StyleSheet.absoluteFill}
                            />
                        )
                    } : undefined,
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
                    component={LedgerNavigationStack}
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
