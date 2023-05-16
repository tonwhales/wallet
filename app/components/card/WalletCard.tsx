import React from "react"
import { View, Image, Text, useWindowDimensions, Pressable } from "react-native"
import { useEngine } from "../../engine/Engine";
import CircularProgress from "../CircularProgress/CircularProgress";
import { useAppConfig } from "../../utils/AppConfigContext";
import { ValueComponent } from "../ValueComponent";
import { t } from "../../i18n/t";
import BN from "bn.js";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ExchangeRate } from "../ExchangeRate";
import { PriceComponent } from "../PriceComponent";
import { WalletAddress } from "../WalletAddress";
import { Address } from "ton";
import GraphIcon from "../../assets/graph.svg";

export const WalletCard = React.memo((
    {
        address,
        balance,
        main,
    }: {
        address: Address,
        balance: BN,
        main?: boolean
    }
) => {
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const syncState = engine.state.use();
    const balanceChart = engine.products.main.useAccountBalanceChart();
    const account = engine.products.main.useAccount();

    const window = useWindowDimensions();
    const cardHeight = Math.floor((window.width / (358 + 32)) * 196);

    const openGraph = React.useCallback(() => {
        if (balanceChart && balanceChart.chart.length > 0) {
            navigation.navigate('AccountBalanceGraph');
        }
    }, [account]);

    const navigateToCurrencySettings = React.useCallback(() => {
        navigation.navigate('Currency');
    }, []);

    return (
        <View
            style={[
                {
                    marginHorizontal: 16, marginVertical: 16,
                    height: cardHeight,
                }
            ]}
            collapsable={false}
        >
            <Image
                source={require('../../../assets/wallet_card.png')}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: cardHeight,
                    width: window.width - 32
                }}
                resizeMode="stretch"
                resizeMethod="resize"
            />
            {main && (
                <View style={{
                    flexDirection: 'row',
                    marginTop: 16, marginLeft: 22,
                    alignItems: 'center'
                }}>
                    {syncState === 'online' && (
                        <View style={{
                            marginRight: 4,
                            height: 8, width: 8,
                            borderRadius: 4,
                            backgroundColor: Theme.success
                        }} />
                    )}
                    {syncState !== 'online' && (
                        <CircularProgress
                            style={{
                                transform: [{ rotate: '-90deg' }],
                                marginRight: 4
                            }}
                            progress={100}
                            animateFromValue={0}
                            duration={6000}
                            size={12}
                            width={2}
                            color={'#FFFFFF'}
                            backgroundColor={'#596080'}
                            fullColor={null}
                            loop={true}
                            containerColor={Theme.transparent}
                        />
                    )}
                    <Text style={{
                        fontSize: 14, fontWeight: '400',
                        color: syncState === 'online' ? Theme.success : '#A2A5B2'
                    }}>
                        {t(`syncStatus.${syncState}`)}
                    </Text>
                </View>
            )}

            <Text style={{ fontSize: 14, color: 'white', opacity: 0.8, marginTop: 16, marginLeft: 22 }}>{t('wallet.balanceTitle')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {main && (
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: (pressed && balanceChart && balanceChart.chart.length > 0) ? 0.3 : 1,
                                marginLeft: 22,
                                flexDirection: 'row', alignItems: 'center'
                            };
                        }}
                        onPress={openGraph}
                    >
                        <Text style={{ fontSize: 30, color: 'white', marginRight: 8, fontWeight: '800', height: 40, marginTop: 2 }}>
                            <ValueComponent value={balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} />
                        </Text>
                        {balance.gt(new BN(0)) && <GraphIcon />}
                    </Pressable>
                )}
                {!main && (
                    <View style={{
                        marginLeft: 22,
                        flexDirection: 'row', alignItems: 'center'
                    }}>
                        <Text style={{ fontSize: 30, color: 'white', marginRight: 8, fontWeight: '800', height: 40, marginTop: 2 }}>
                            <ValueComponent value={balance} centFontStyle={{ fontSize: 22, fontWeight: '500', opacity: 0.55 }} />
                        </Text>
                    </View>
                )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 22, marginTop: 6 }}>
                <Pressable
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.3 : 1,
                        }
                    }}
                    onPress={navigateToCurrencySettings}
                >
                    <PriceComponent amount={account?.balance ?? new BN(0)} />
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
            <View style={{ flexGrow: 1 }} />
            <WalletAddress
                value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                address={address}
                elipsise
                style={{
                    marginLeft: 22,
                    marginBottom: 24,
                    alignSelf: 'flex-start',
                }}
                textStyle={{
                    textAlign: 'left',
                    color: 'white',
                    fontWeight: '500',
                    fontFamily: undefined
                }}
                lockActions
            />
        </View>
    );
});