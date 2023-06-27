import * as React from 'react';
import { Image, LayoutAnimation, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { getCurrentAddress } from '../../storage/appState';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueComponent } from '../../components/ValueComponent';
import { resolveUrl } from '../../utils/resolveUrl';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { fragment } from '../../fragment';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useEngine } from '../../engine/Engine';
import { WalletState } from '../../engine/products/WalletProduct';
import { useLinkNavigator } from "../../useLinkNavigator";
import { useAppConfig } from '../../utils/AppConfigContext';
import { ProductsComponent } from '../../components/products/ProductsComponent';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { useAppStateManager } from '../../engine/AppStateManager';
import { WalletAddress } from '../../components/WalletAddress';

import Chart from '../../../assets/ic-chart.svg';
import ChevronDown from '../../../assets/ic-chevron-down.svg';
import Scanner from '../../../assets/ic-scanner.svg';

function WalletComponent(props: { wallet: WalletState }) {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
    const balanceChart = engine.products.main.useAccountBalanceChart();
    const account = props.wallet;
    const appStateManager = useAppStateManager();
    const accounts = React.useMemo(() => {
        const cursor = appStateManager.current.selected;
        const wallets = appStateManager.current.addresses.map((a, i) => {
            return {
                id: i,
                address: a.address,
                selected: i === cursor,
            }
        });
        const selected = wallets.splice(cursor);
        return [...selected, ...wallets];
        // return wallets;

    }, [appStateManager.current]);

    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src, AppConfig.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch (error) {
            // Ignore
        }
    };

    const onOpenBuy = useCallback(
        () => {
            navigation.navigate('Buy');
        },
        [],
    );

    const openGraph = useCallback(() => {
        if (balanceChart && balanceChart.chart.length > 0) {
            navigation.navigate('AccountBalanceGraph');
        }
    }, [account]);

    const selectAccount = useCallback(() => {

    }, []);

    const navigateToCurrencySettings = useCallback(() => {
        navigation.navigate('Currency');
    }, []);

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [account.pending.length]);

    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.item }}>
            <View
                style={{
                    backgroundColor: '#131928',
                    paddingTop: safeArea.top,
                    paddingHorizontal: 16,
                    borderBottomEndRadius: 24,
                    borderBottomStartRadius: 24,
                    paddingBottom: 20,
                }}
                collapsable={false}
            >

                <View style={{
                    height: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1
                            }
                        }}
                        onPress={selectAccount}
                    >

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                width: 24, height: 24,
                                backgroundColor: Theme.accent,
                                borderRadius: 12
                            }}>
                            </View>
                            <Text style={{ marginLeft: 12, fontWeight: '500', fontSize: 17, color: '#AAB4BF' }}>
                                {'Wallet 1'}
                            </Text>
                            <ChevronDown
                                style={{
                                    height: 16,
                                    width: 16,
                                    marginLeft: 8,
                                }}
                                height={16}
                                width={16}
                                color={'#AAB4BF'}
                            />
                        </View>
                    </Pressable>
                    <View style={{ flexDirection: 'row' }}>
                        <Chart
                            style={{
                                height: 24,
                                width: 24,
                            }}
                            height={24}
                            width={24}
                            color={'#AAB4BF'}
                        />
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1
                                }
                            }}
                            onPress={() => navigation.navigate('Scanner', { callback: onQRCodeRead })}
                        >
                            <Scanner
                                style={{
                                    height: 24,
                                    width: 24,
                                    marginLeft: 14
                                }}
                                height={24}
                                width={24}
                                color={'#AAB4BF'}
                            />
                        </Pressable>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{
                        fontSize: 32,
                        color: 'white',
                        marginRight: 8,
                        fontWeight: '500',
                    }}>

                        <ValueComponent precision={6} value={account.balance} />
                        <Text style={{
                            fontSize: 17,
                            color: '#838D99',
                            marginRight: 8,
                            fontWeight: '500',
                        }}>{' TON'}</Text>
                    </Text>
                </View>
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    marginTop: 8
                }}>
                    <Pressable onPress={navigateToCurrencySettings}>
                        <PriceComponent amount={account.balance} />
                    </Pressable>
                </View>
                <View style={{ flexGrow: 1 }} />
                <WalletAddress
                    value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                    address={address}
                    elipsise
                    style={{
                        marginTop: 12,
                        alignSelf: 'flex-start',
                    }}
                    textStyle={{
                        fontSize: 13,
                        textAlign: 'left',
                        color: '#838D99',
                        fontWeight: '400',
                        fontFamily: undefined
                    }}
                    limitActions
                />
                <View style={{
                    flexDirection: 'row',
                    marginHorizontal: 16,
                    backgroundColor: '#1F283E',
                    borderRadius: 20,
                    paddingVertical: 20,
                    marginTop: 24
                }} collapsable={false}>
                    {
                        (!AppConfig.isTestnet && Platform.OS === 'android') && (
                            <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, borderRadius: 14 }}>
                                <TouchableHighlight
                                    onPress={onOpenBuy}
                                    underlayColor={Theme.selector}
                                    style={{ borderRadius: 14 }}
                                >
                                    <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                        <View style={{
                                            backgroundColor: Theme.accent,
                                            width: 32, height: 32,
                                            borderRadius: 16,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Image source={require('../../../assets/ic_buy.png')} />
                                        </View>
                                        <Text style={{ fontSize: 15, color: Theme.item, marginTop: 6 }}>{t('wallet.actions.buy')}</Text>
                                    </View>
                                </TouchableHighlight>
                            </View>
                        )
                    }
                    <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, borderRadius: 14 }}>
                        <TouchableHighlight
                            onPress={() => navigation.navigate('Receive')}
                            underlayColor={Theme.selector}
                            style={{ borderRadius: 14 }}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                <View style={{
                                    backgroundColor: Theme.accent,
                                    width: 32, height: 32,
                                    borderRadius: 16,
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Image source={require('../../../assets/ic_receive.png')} />
                                </View>
                                <Text style={{ fontSize: 15, color: Theme.item, marginTop: 6, fontWeight: '400' }}>{t('wallet.actions.receive')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14 }}>
                        <TouchableHighlight
                            onPress={() => navigation.navigateSimpleTransfer({ amount: null, target: null, stateInit: null, job: null, comment: null, jetton: null, callback: null })}
                            underlayColor={Theme.selector}
                            style={{ borderRadius: 14 }}
                        >
                            <View style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}>
                                <View style={{
                                    backgroundColor: Theme.accent,
                                    width: 32, height: 32,
                                    borderRadius: 16,
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Image source={require('../../../assets/ic_send.png')} />
                                </View>
                                <Text style={{ fontSize: 15, color: Theme.item, marginTop: 6, fontWeight: '400' }}>{t('wallet.actions.send')}</Text>
                            </View>
                        </TouchableHighlight>
                    </View>
                </View>
            </View>
            <ScrollView
                style={{ flexBasis: 0 }}
                contentContainerStyle={{
                    backgroundColor: Theme.item,
                    paddingBottom: 16
                }}
            >
                <ProductsComponent />
            </ScrollView>
        </View>
    );
}

export const WalletFragment = fragment(() => {
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    if (!account) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
            </View>
        );
    } else {
        return <WalletComponent wallet={account} />
    }
}, true);