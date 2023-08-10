import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useLedgerTransport } from "./components/LedgerTransportProvider";
import { useEngine } from "../../engine/Engine";
import { useCallback, useEffect, useMemo } from "react";
import { Address, CellMessage } from "ton";
import { useBottomSheet } from "../../components/modal/BottomSheetModal";
import { t } from "../../i18n/t";
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { warn } from "../../utils/log";
import { Pressable, View, Image, Text, TouchableHighlight, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ValueComponent } from "../../components/ValueComponent";
import { PriceComponent } from "../../components/PriceComponent";
import BN from "bn.js";
import { WalletAddress } from "../../components/WalletAddress";
import { LedgerProductsComponent } from "../../components/products/LedgerProductsComponent";
import { resolveUrl } from "../../utils/resolveUrl";

import ChevronDown from '../../../assets/ic-chevron-down.svg';
import Scanner from '../../../assets/ic-scanner.svg';

export const LedgerHomeFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const ledgerContext = useLedgerTransport();
    const engine = useEngine();
    const address = useMemo(() => {
        if (!ledgerContext?.addr) {
            return null;
        }
        try {
            const address = Address.parse(ledgerContext.addr.address);
            engine.products.ledger.startSync(address);
            return address;
        } catch (e) {
            return null;
        }
    }, [ledgerContext?.addr?.address]);
    const modal = useBottomSheet();
    const account = engine.products.ledger.useAccount();

    const onQRCodeRead = useCallback((src: string) => {
        try {
            let res = resolveUrl(src, AppConfig.isTestnet);
            if (res && (res.type === 'jetton-transaction' || res.type === 'transaction')) {
                if (res.type === 'transaction') {
                    if (res.payload) {
                        navigation.navigateLedgerSignTransfer({
                            order: {
                                target: res.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                                amount: res.amount || new BN(0),
                                amountAll: false,
                                stateInit: res.stateInit,
                                payload: {
                                    type: 'unsafe',
                                    message: new CellMessage(res.payload),
                                },
                            },
                            text: res.comment
                        });
                    } else {
                        navigation.navigateLedgerTransfer({
                            target: res.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                            comment: res.comment,
                            amount: res.amount,
                            stateInit: res.stateInit,
                            job: null,
                            jetton: null,
                            callback: null
                        });
                    }
                    return;
                }
                navigation.navigateLedgerTransfer({
                    target: res.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                    comment: res.comment,
                    amount: res.amount,
                    stateInit: null,
                    job: null,
                    jetton: res.jettonMaster,
                    callback: null
                });
            }
        } catch {
            // Ignore
        }
    }, []);

    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);
    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);
    // const openGraph = useCallback(() => {
    //     if (balanceChart && balanceChart.chart.length > 0) {
    //         navigation.navigate('AccountBalanceGraph');
    //     }
    // }, []);
    const navigateTransfer = useCallback(() => {
        navigation.navigate('LedgerTransfer', {
            amount: null,
            target: null,
            comment: null,
            jetton: null,
            stateInit: null,
            job: null,
            callback: null
        });
    }, []);

    const navigateReceive = useCallback(() => {
        if (!ledgerContext?.addr) {
            return;
        }
        navigation.navigate(
            'LedgerReceive',
            {
                addr: ledgerContext.addr.address,
                ledger: true
            }
        );
    }, []);

    // Wallet Account modal
    const onAccountPress = useCallback(() => {
        navigation.navigate('AccountSelector');
    }, [modal]);

    // ScrollView background color animation
    const scrollBackgroundColor = useSharedValue(1);
    // Views border radius animation on scroll
    const scrollBorderRadius = useSharedValue(24);

    const onScroll = useAnimatedScrollHandler((event) => {
        if ((event.contentOffset.y) >= 0) { // Overscrolled to top
            scrollBackgroundColor.value = 1;
        } else { // Overscrolled to bottom
            scrollBackgroundColor.value = 0;
        }
        if (event.contentOffset.y <= -(safeArea.top - 290)) {
            scrollBorderRadius.value = 24;
        } else {
            const diffRadius = (safeArea.top - 290) + event.contentOffset.y;
            scrollBorderRadius.value = 24 - diffRadius
        }
    }, []);

    const scrollStyle = useAnimatedStyle(() => {
        return { backgroundColor: scrollBackgroundColor.value === 0 ? '#131928' : 'white', };
    });

    const viewCardStyle = useAnimatedStyle(() => {
        return {
            borderBottomEndRadius: scrollBorderRadius.value,
            borderBottomStartRadius: scrollBorderRadius.value,
        }
    });

    useEffect(() => {
        if (!address) {
            return;
        }
        try {
            engine.products.ledger.startSync(address);
        } catch {
            warn('Failed to parse Ledger address');
        }
    }, [address])

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
        <View style={{ flexGrow: 1, backgroundColor: Theme.item }}>
            <StatusBar style={'light'} />
            <View
                style={{
                    backgroundColor: '#131928',
                    paddingTop: safeArea.top,
                    paddingHorizontal: 16
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
                        onPress={onAccountPress}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                width: 24, height: 24,
                                backgroundColor: Theme.accent,
                                borderRadius: 12
                            }}>
                                <Image
                                    style={{
                                        width: 24,
                                        height: 24,
                                    }}
                                    source={require('../../../assets/ledger_device.png')}
                                />
                            </View>
                            <Text
                                style={{
                                    marginLeft: 12, fontWeight: '500',
                                    fontSize: 17,
                                    color: Theme.greyForIcon, maxWidth: '70%'
                                }}
                                ellipsizeMode='tail'
                                numberOfLines={1}
                            >
                                {t('hardwareWallet.ledger')}
                            </Text>
                            <ChevronDown
                                style={{
                                    height: 16,
                                    width: 16,
                                    marginLeft: 8,
                                }}
                                height={16}
                                width={16}
                                color={Theme.greyForIcon}
                            />
                        </View>
                    </Pressable>
                    <View style={{ flexDirection: 'row' }}>
                        <Pressable
                            style={({ pressed }) => { return { opacity: pressed ? 0.5 : 1 } }}
                            onPress={openScanner}
                        >
                            <Scanner
                                style={{
                                    height: 24,
                                    width: 24,
                                    marginLeft: 14
                                }}
                                height={24}
                                width={24}
                                color={Theme.greyForIcon}
                            />
                        </Pressable>
                    </View>
                </View>
            </View>
            <Animated.ScrollView
                style={[{ flexBasis: 0 }, scrollStyle]}
                contentContainerStyle={{ paddingBottom: 16, backgroundColor: 'white' }}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                decelerationRate={'fast'}
                alwaysBounceVertical={false}
            >
                <Animated.View
                    style={[{
                        backgroundColor: '#131928',
                        paddingHorizontal: 16,
                        paddingVertical: 20,
                    }, viewCardStyle]}
                    collapsable={false}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                            fontSize: 32,
                            color: 'white',
                            marginRight: 8,
                            fontWeight: '500',
                            lineHeight: 38,
                        }}>
                            <ValueComponent precision={6} value={account?.balance ?? new BN(0)} />
                            <Text style={{
                                fontSize: 17,
                                lineHeight: Platform.OS === 'ios' ? 24 : undefined,
                                color: Theme.darkGrey,
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
                            <PriceComponent amount={account?.balance ?? new BN(0)} />
                        </Pressable>
                    </View>
                    <View style={{ flexGrow: 1 }} />
                    <WalletAddress
                        value={ledgerContext.addr.address}
                        address={Address.parse(ledgerContext.addr.address)}
                        elipsise
                        style={{
                            marginTop: 12,
                            alignSelf: 'flex-start',
                        }}
                        textStyle={{
                            fontSize: 13,
                            lineHeight: 18,
                            textAlign: 'left',
                            color: Theme.darkGrey,
                            fontWeight: '400',
                            fontFamily: undefined
                        }}
                        limitActions
                    />
                    <View
                        style={{
                            flexDirection: 'row',
                            marginHorizontal: 16,
                            backgroundColor: '#1F283E',
                            borderRadius: 20,
                            marginTop: 24
                        }}
                        collapsable={false}
                    >
                        <View style={{ flexGrow: 1, flexBasis: 0, marginRight: 7, borderRadius: 14, padding: 20 }}>
                            <TouchableHighlight
                                onPress={navigateReceive}
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
                        <View style={{ flexGrow: 1, flexBasis: 0, borderRadius: 14, padding: 20 }}>
                            <TouchableHighlight
                                onPress={navigateTransfer}
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
                </Animated.View>
                <LedgerProductsComponent />
            </Animated.ScrollView>
        </View>
    );
})