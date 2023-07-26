import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo } from "react";
import { View, Text, Pressable, TouchableHighlight, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useLedgerTransport } from "./components/LedgerTransportProvider";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useBottomSheet } from "../../components/modal/BottomSheetModal";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { WalletSelector } from "../../components/wallet/WalletSelector";
import { BlurView } from "expo-blur";
import { RoundButton } from "../../components/RoundButton";
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { ValueComponent } from "../../components/ValueComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { WalletAddress } from "../../components/WalletAddress";
import { Address } from "ton";
import { useEngine } from "../../engine/Engine";
import { LedgerProductsComponent } from "../../components/products/LedgerProductsComponent";

import Chart from '../../../assets/ic-chart.svg';
import ChevronDown from '../../../assets/ic-chevron-down.svg';
import Scanner from '../../../assets/ic-scanner.svg';
import { startWalletV4Sync } from "../../engine/sync/startWalletV4Sync";
import { warn } from "../../utils/log";
import BN from "bn.js";

export type LedgerAppParams = {
    address: { address: string, publicKey: Buffer },
};

export const LedgerAppFragment = fragment(() => {
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
    const { showActionSheetWithOptions } = useActionSheet();


    const onQRCodeRead = (src: string) => {
    };

    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);
    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);
    const openGraph = useCallback(() => {
        // if (balanceChart && balanceChart.chart.length > 0) {
        //     navigation.navigate('AccountBalanceGraph');
        // }
    }, []);
    const navigateTransfer = useCallback(() => {
        navigation.replace('LedgerTransfer', {
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

    // Add new wallet account modal
    const onAddNewAccount = useCallback(() => {
        const options = [t('common.cancel'), t('create.addNew'), t('welcome.importWallet'), t('hardwareWallet.actions.connect')];
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    modal?.hide();
                    navigation.navigate('WalletCreate', { additionalWallet: true });
                    break;
                case 2:
                    modal?.hide();
                    navigation.navigate('WalletImport', { additionalWallet: true });
                    break;
                case 3:
                    modal?.hide();
                    navigation.navigate('Ledger');
                    break;
                default:
                    break;
            }
        });
    }, [modal]);
    // Wallet Account modal
    const onAccountPress = useCallback(() => {
        modal?.hide();
        modal?.show(
            <WalletSelector />,
            ['60%', '80%'],
            <BlurView intensity={30} style={{ paddingBottom: safeArea.bottom, paddingHorizontal: 16 }}>
                <RoundButton
                    style={{ marginVertical: 16 }}
                    onPress={onAddNewAccount}
                    title={t('wallets.addNewTitle')}
                />
            </BlurView>
        );
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
            startWalletV4Sync(address, engine);
            engine.products.ledger.startSync(address);
        } catch (e) {
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
                                color={'#AAB4BF'}
                            />
                        </View>
                    </Pressable>
                    <View style={{ flexDirection: 'row' }}>
                        <Pressable
                            style={({ pressed }) => { return { opacity: pressed ? 0.5 : 1 } }}
                            onPress={openGraph}
                        >
                            <Chart
                                style={{
                                    height: 24,
                                    width: 24,
                                }}
                                height={24}
                                width={24}
                                color={'#AAB4BF'}
                            />
                        </Pressable>
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
                                color={'#AAB4BF'}
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
                                lineHeight: 24,
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
            {/* <LedgerApp
                transport={ledgerContext.tonTransport}
                account={ledgerContext.addr.acc}
                address={ledgerContext.addr}
            /> */}
        </View>
    );
})
