import React from "react";
import { View, Text, Pressable } from "react-native";
import { AppConfig } from "../AppConfig";
import { Engine } from "../engine/Engine";
import { WalletState } from "../engine/products/WalletProduct";
import { t } from "../i18n/t";
import { getCurrentAddress } from "../storage/appState";
import { Theme } from "../Theme";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { ExchangeRate } from "./ExchangeRate";
import { PriceComponent } from "./PriceComponent";
import { ValueComponent } from "./ValueComponent";
import { WalletAddress } from "./WalletAddress";

export const WalletAccountCard = React.memo(({ engine, account }: { engine: Engine, account: WalletState }) => {
    const navigation = useTypedNavigation();
    // const syncState = engine.state.use();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const navigateToCurrencySettings = React.useCallback(() => {
        navigation.navigate('Currency');
    }, []);

    return (
        <View
            style={{
                marginHorizontal: 16,
                marginTop: 16, marginBottom: 20,
                backgroundColor: Theme.item,
                paddingVertical: 14, paddingHorizontal: 20,
                borderRadius: 20
            }}
            collapsable={false}
        >
            <Text style={{ fontSize: 14, color: Theme.textColor, opacity: 0.8 }}>{t('wallet.balanceTitle')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                    style={({ pressed }) => { return { opacity: pressed ? 0.3 : 1 } }}
                    onPress={navigateToCurrencySettings}
                >
                    <PriceComponent
                        style={{
                            backgroundColor: 'transparent',
                            height: undefined,
                            flex: 1, paddingVertical: 0, paddingHorizontal: 0
                        }}
                        textStyle={{
                            color: Theme.textColor,
                            fontSize: 30,
                            lineHeight: undefined,
                            fontWeight: '700',
                        }}
                        centFontStyle={{
                            fontSize: 20
                        }}
                        amount={account.balance}
                    />
                </Pressable>
                <Pressable style={({ pressed }) => {
                    return {
                        marginLeft: 8,
                        opacity: pressed ? 0.3 : 1
                    }
                }}
                    onPress={navigateToCurrencySettings}
                >
                    <ExchangeRate />
                </Pressable>
            </View>
            <Text style={{
                fontSize: 14,
                color: Theme.textColor,
                fontWeight: '400',
                marginTop: 2
            }}>
                <ValueComponent
                    value={account.balance}
                    precision={3}
                />
                {' TON'}
            </Text>
        </View>
    );
});