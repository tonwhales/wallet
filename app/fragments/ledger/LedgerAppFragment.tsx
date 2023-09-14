import { useEffect } from "react";
import { View, Image } from "react-native";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useLedgerTransport } from "./components/LedgerTransportProvider";
import { useAppConfig } from "../../utils/AppConfigContext";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LedgerHomeFragment } from "./LedgerHomeFragment";
import { LedgerTransactionsFragment } from "./LedgerTransactionsFragment";

const Tab = createBottomTabNavigator();

export const LedgerAppFragment = fragment(() => {
    const { Theme } = useAppConfig();
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
                initialRouteName={'Wallet'}
                screenOptions={({ route }) => ({
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
                                style={{ tintColor: focused ? Theme.accent : Theme.iconPrimary, height: 24, width: 24 }}
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
                    component={LedgerTransactionsFragment}
                />
            </Tab.Navigator>
        </View>
    );
})
