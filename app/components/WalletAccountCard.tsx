import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Engine } from "../engine/Engine";
import { WalletState } from "../engine/products/WalletProduct";
import { t } from "../i18n/t";
import { getCurrentAddress } from "../storage/appState";
import { Theme } from "../Theme";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { PriceComponent } from "./PriceComponent";
import { ValueComponent } from "./ValueComponent";
import { WalletAddress } from "./WalletAddress";
import HideIcon from '../../assets/ic_visible.svg';

export const WalletAccountCard = React.memo(({ engine, account, hidden, setHidden }: { engine: Engine, account: WalletState, hidden: boolean, setHidden: (newVal: boolean) => void }) => {
    const navigation = useTypedNavigation();
    // const syncState = engine.state.use();
    const staking = engine.products.whalesStakingPools.useStaking();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const totalBalance = useMemo(() => {
        return account.balance.add(staking.total);
    }, [staking, account]);

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
            <Text style={{ fontSize: 14, color: Theme.price }}>{t('wallet.balanceTitle')}</Text>
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
                        amount={totalBalance}
                        hidden={hidden}
                    />
                </Pressable>
                {/* <Pressable style={({ pressed }) => {
                    return {
                        marginLeft: 8,
                        opacity: pressed ? 0.3 : 1
                    }
                }}
                    onPress={navigateToCurrencySettings}
                >
                    <ExchangeRate />
                </Pressable> */}
            </View>
            <View style={{
                flexDirection: 'row', width: '100%',
                marginTop: 2, justifyContent: 'space-between'
            }}>
                <ValueComponent
                    value={totalBalance}
                    precision={3}
                    hidden={hidden}
                    style={{
                        fontSize: 14,
                        color: Theme.textColor,
                        fontWeight: '500',
                    }}
                    suffix={' TON'}
                />
                <WalletAddress
                    textStyle={{ color: Theme.price, fontSize: 14, fontWeight: '400' }}
                    address={address}
                    elipsiseStart={4}
                    elipsiseEnd={4}
                    elipsise
                    dropdownMenuMode
                    lockActions
                    previewBackgroundColor={'white'}
                />
            </View>
            <Pressable style={({ pressed }) => {
                return {
                    position: 'absolute', top: 0, right: 9,
                    height: 48, width: 48, justifyContent: 'center', alignItems: 'center',
                    opacity: pressed ? 0.3 : 1
                }
            }}
                onPress={() => setHidden(!hidden)}
            >
                <HideIcon
                    color={'black'}
                    style={{ opacity: Platform.OS === 'android' ? 0.4 : 1 }}

                />
            </Pressable>
        </View>
    );
});