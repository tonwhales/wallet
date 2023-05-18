import React from "react"
import { View, Image, Text, useWindowDimensions, Pressable, Alert } from "react-native"
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
import GraphIcon from "../../../assets/ic_graph.svg";
import { useAppStateManager } from "../../engine/AppStateManager";
import { ScalingPressable } from "../ScalingPressable";
import { shortAddress } from "../../utils/shortAddress";
import { NewAccountCard } from "./NewAccountCard";
import ForwardIcon from '../../../assets/ic_chevron_forward.svg'

export const WalletCard = React.memo((
    {
        address,
        index,
        total,
        selected
    }: {
        address: Address,
        index: number,
        total: number,
        selected?: boolean
    }
) => {
    const { Theme, AppConfig } = useAppConfig();
    const appStateManager = useAppStateManager();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const syncState = engine.state.use();
    const balanceChart = engine.products.main.useAccountBalanceChart();
    const wallet = engine.products.wallets.useWallet(address);
    const balance = React.useMemo(() => {
        return wallet?.balance ?? new BN(0);
    }, [wallet]);

    const window = useWindowDimensions();
    const cardHeight = Math.floor((window.width / (358 + 32)) * 196);
    const cardWidth = window.width - 32;

    const openGraph = React.useCallback(() => {
        if (balanceChart && balanceChart.chart.length > 0) {
            navigation.navigate('AccountBalanceGraph');
        }
    }, []);

    const navigateToCurrencySettings = React.useCallback(() => {
        navigation.navigate('Currency');
    }, []);

    const onSelectAccount = React.useCallback(() => {
        if (selected) return;
        const index = appStateManager.current.addresses.findIndex((a) => a.address.toFriendly() === address.toFriendly());
        Alert.alert(
            t('wallets.switchToAlertTitle', { wallet: shortAddress({ address, isTestnet: AppConfig.isTestnet }) }),
            t('wallets.switchToAlertMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('wallets.switchToAlertAction'),
                    onPress: () => {
                        appStateManager.updateAppState({
                            ...appStateManager.current,
                            selected: index
                        })
                    },
                }
            ]
        );
    }, []);

    return (
        <>
            <ScalingPressable
                transformScale={0.99}
                lock={selected}
                onPress={onSelectAccount}
            >
                <View
                    style={[{
                        marginLeft: index === 0 ? 16 : 0,
                        marginRight: 8,
                        height: cardHeight, width: cardWidth,
                        borderRadius: 16, overflow: 'hidden',
                    }]}
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
                            width: cardWidth
                        }}
                        resizeMode="stretch"
                        resizeMethod="resize"
                    />
                    {selected && (
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
                        {selected && (
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
                        {!selected && (
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
                            <PriceComponent
                                style={!selected ? { backgroundColor: undefined, paddingVertical: 0, paddingHorizontal: 0 } : undefined}
                                amount={balance}
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
                    <View style={{ flexGrow: 1 }} />
                    {!selected && (
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginHorizontal: 22,
                            marginBottom: 24,
                        }}>
                            <WalletAddress
                                value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                address={address}
                                elipsise
                                textStyle={{
                                    textAlign: 'left',
                                    color: 'white',
                                    fontWeight: '500',
                                    fontFamily: undefined
                                }}
                                lockActions
                            />
                            <View style={{
                                backgroundColor: Theme.textColor,
                                flexDirection: 'row',
                                flex: 0, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 8,
                                justifyContent: 'center', alignItems: 'center',
                            }}>
                                <Text style={{
                                    fontWeight: '600',
                                    color: Theme.item, marginRight: 8
                                }}>
                                    {t('common.select')}
                                </Text>
                                <ForwardIcon />
                            </View>
                        </View>
                    )}
                    {selected && (
                        <WalletAddress
                            value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                            address={address}
                            elipsise
                            textStyle={{
                                textAlign: 'left',
                                color: 'white',
                                fontWeight: '500',
                                fontFamily: undefined
                            }}
                            style={{
                                marginLeft: 22,
                                marginBottom: 24,
                                alignSelf: 'flex-start',
                            }}
                            lockActions
                        />
                    )}
                </View>
            </ScalingPressable>
            {index === total - 1 && (
                <View style={{ marginRight: 16 }}>
                    <NewAccountCard />
                </View>
            )}
        </>
    );
});