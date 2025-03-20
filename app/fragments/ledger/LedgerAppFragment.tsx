import React from "react";
import { View, Image, Platform, StyleSheet } from "react-native";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LedgerNavigationStack } from "./LedgerHomeFragment";
import { useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "./components/TransportContext";
import { TransactionsFragment } from "../wallet/TransactionsFragment";
import { BlurView } from "expo-blur";
import { SettingsFragment } from '../SettingsFragment';
import { HintsPrefetcher } from "../../components/HintsPrefetcher";
import { PendingTxsWatcher } from "../../components/PendingTxsWatcher";
import { Address } from "@ton/core";
import { useAccountTransactionsV2 } from "../../engine/hooks/transactions/useAccountTransactionsV2";
import { TransactionType } from "../../engine/types";
import { HoldersAppFragment, HoldersAppParamsType } from "../holders/HoldersAppFragment";
import { useAppMode } from "../../engine/hooks/appstate/useAppMode";
import { HoldersSettings } from "../holders/components/HoldersSettings";

const Tab = createBottomTabNavigator();

const PrefetchTransactions = ({ address }: { address: string }) => {
    useAccountTransactionsV2(address, { refetchOnMount: true }, { type: TransactionType.TON });
    return null;
}

export const LedgerAppFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const { isTestnet: testOnly } = useNetwork();
    const selected = useSelectedAccount();
    const [isWalletMode] = useAppMode(selected?.address);

    if (!ledgerContext.addr) {
        navigation.navigateAndReplaceAll('Home')
        return null;
    }

    const address = Address.parse(ledgerContext.addr.address);
    const addressString = address.toString({ testOnly });

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
                    unmountOnBlur: false,
                    tabBarIcon: ({ focused }) => {
                        let source = require('@assets/ic-home.png');

                        if (route.name === 'LedgerTransactions') {
                            source = require('@assets/ic-history.png');
                        }

                        if ((route.name === 'LedgerSettings')) {
                            source = require('@assets/ic-settings.png');
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
                <Tab.Screen
                    options={{ title: t('home.settings') }}
                    name={'LedgerSettings'}
                    component={isWalletMode ? SettingsFragment : HoldersSettings}
                />
            </Tab.Navigator>
            <HintsPrefetcher address={addressString} />
            <PendingTxsWatcher address={addressString} />
        </View>
    );
})
