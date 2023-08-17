import * as React from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { getCurrentAddress } from '../../storage/appState';
import { nullTransfer, useTypedNavigation } from '../../utils/useTypedNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValueComponent } from '../../components/ValueComponent';
import { t } from '../../i18n/t';
import { PriceComponent } from '../../components/PriceComponent';
import { fragment } from '../../fragment';
import { useEngine } from '../../engine/Engine';
import { WalletState } from '../../engine/products/WalletProduct';
import { useAppConfig } from '../../utils/AppConfigContext';
import { ProductsComponent } from '../../components/products/ProductsComponent';
import { useCallback, useMemo } from 'react';
import { WalletAddress } from '../../components/WalletAddress';
import Animated, { SensorType, useAnimatedScrollHandler, useAnimatedSensor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useTrackScreen } from '../../analytics/mixpanel';
import { WalletHeaderFragment } from './views/WalletHeaderFragment';
import { toNano } from 'ton';
import BN from 'bn.js';

function WalletComponent(props: { wallet: WalletState | null }) {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const address = useMemo(() => getCurrentAddress().address, []);
    const account = props.wallet;
    const animSensor = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 100 });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: withTiming(animSensor.sensor.value.y * 80) },
                { translateY: withTiming(animSensor.sensor.value.x * 80) },
            ]
        }
    });

    const navigateToCurrencySettings = useCallback(() => navigation.navigate('Currency'), []);
    const onOpenBuy = useCallback(() => navigation.navigate('Buy'), []);

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
        return { backgroundColor: scrollBackgroundColor.value === 0 ? Theme.walletBackground : Theme.white };
    });

    return (
        <View style={{ flexGrow: 1, backgroundColor: Theme.walletBackground }}>
            <WalletHeaderFragment />
            <Animated.ScrollView
                style={[{ flexBasis: 0 }, scrollStyle]}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                decelerationRate={'normal'}
                alwaysBounceVertical={true}
            >
                <View
                    style={[
                        {
                            backgroundColor: Theme.walletBackground,
                            paddingHorizontal: 16,
                            paddingVertical: 20,
                        },
                    ]}
                    collapsable={false}
                >
                    <View style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 20,
                        paddingVertical: 16, paddingHorizontal: 20,
                        overflow: 'hidden'
                    }}>
                        <Text style={{
                            color: Theme.white, opacity: 0.7,
                            fontSize: 15, lineHeight: 20,
                            fontWeight: '400',
                            marginBottom: 14
                        }}>
                            {t('common.balance')}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{
                                fontSize: 27,
                                color: Theme.white,
                                marginRight: 8,
                                fontWeight: '500',
                                lineHeight: 32,
                            }}>
                                <ValueComponent precision={6} value={account?.balance ?? new BN(0)} />
                                <Text style={{
                                    fontSize: 17,
                                    lineHeight: Platform.OS === 'ios' ? 24 : undefined,
                                    color: Theme.white,
                                    marginRight: 8,
                                    fontWeight: '500',
                                }}>{' TON'}</Text>
                            </Text>
                        </View>
                        <Animated.View
                            style={[{
                                position: 'absolute', top: 0, left: '50%',
                                marginTop: -20, marginLeft: -20,
                                height: 400, width: 400,
                                borderRadius: 400,
                                overflow: 'hidden'
                            },
                                animatedStyle
                            ]}
                            pointerEvents={'none'}
                        >
                            <Image
                                source={require('../../../assets/shine-blur.png')}
                                style={{ height: 400, width: 400 }}
                            />
                        </Animated.View>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            marginTop: 10
                        }}>
                            <Pressable
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={navigateToCurrencySettings}
                            >
                                <PriceComponent
                                    amount={account?.balance ?? new BN(0)}
                                    style={{ backgroundColor: 'rgba(255,255,255, .1)' }}
                                />
                                <PriceComponent
                                    showSign
                                    amount={toNano(1)}
                                    style={{ backgroundColor: 'rgba(255,255,255, .1)', marginLeft: 10 }}
                                />
                            </Pressable>
                        </View>
                        <View style={{ flexGrow: 1 }} />
                        <WalletAddress
                            value={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                            address={address}
                            elipsise
                            style={{
                                marginTop: 20,
                                alignSelf: 'flex-start',
                            }}
                            textStyle={{
                                fontSize: 15,
                                lineHeight: 20,
                                textAlign: 'left',
                                color: Theme.darkGrey,
                                fontWeight: '400',
                                fontFamily: undefined
                            }}
                            limitActions
                        />
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: 20,
                            marginTop: 16,
                            overflow: 'hidden'
                        }}
                        collapsable={false}
                    >
                        {
                            (!AppConfig.isTestnet && Platform.OS === 'android') && (
                                <View style={{
                                    flexGrow: 1, flexBasis: 0,
                                    marginRight: 7,
                                    borderRadius: 14,
                                    padding: 10
                                }}>
                                    <Pressable
                                        onPress={onOpenBuy}
                                        style={({ pressed }) => {
                                            return {
                                                opacity: pressed ? 0.5 : 1,
                                                borderRadius: 14, flex: 1, paddingVertical: 10,
                                                marginHorizontal: 20
                                            }
                                        }}
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
                                            <Text style={{
                                                fontSize: 15, lineHeight: 20,
                                                color: Theme.item,
                                                marginTop: 6
                                            }}>
                                                {t('wallet.actions.buy')}
                                            </Text>
                                        </View>
                                    </Pressable>
                                </View>
                            )
                        }
                        <View style={{
                            flexGrow: 1, flexBasis: 0,
                            marginRight: 7,
                            borderRadius: 14,
                            padding: 10
                        }}>
                            <Pressable
                                onPress={() => navigation.navigate('Receive')}
                                style={({ pressed }) => {
                                    return {
                                        opacity: pressed ? 0.5 : 1,
                                        borderRadius: 14, flex: 1, paddingVertical: 10,
                                        marginHorizontal: 20
                                    }
                                }}
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
                                    <Text
                                        style={{
                                            fontSize: 15, lineHeight: 20,
                                            color: Theme.item,
                                            marginTop: 6
                                        }}>
                                        {t('wallet.actions.receive')}
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                        <View style={{
                            flexGrow: 1, flexBasis: 0,
                            marginRight: 7,
                            borderRadius: 14,
                            padding: 10
                        }}>
                            <Pressable
                                onPress={() => navigation.navigateSimpleTransfer(nullTransfer)}
                                style={({ pressed }) => {
                                    return {
                                        opacity: pressed ? 0.5 : 1,
                                        borderRadius: 14, flex: 1, paddingVertical: 10,
                                        marginHorizontal: 20
                                    }
                                }}
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
                            </Pressable>
                        </View>
                        <Animated.View
                            style={[{
                                position: 'absolute', top: '-175%', left: '50%',
                                marginTop: -20, marginLeft: -20,
                                height: 400, width: 400, borderRadius: 200,
                                overflow: 'hidden'
                            },
                                animatedStyle
                            ]}
                            pointerEvents={'none'}
                        >
                            <Image
                                source={require('../../../assets/shine-blur.png')}
                                style={{ height: 400, width: 400 }}
                            />
                        </Animated.View>
                    </View>
                </View>
                <ProductsComponent />
                <View style={{ height: 100, width: '100%', backgroundColor: Theme.white }} />
            </Animated.ScrollView>
        </View>
    );
}

export const WalletFragment = fragment(() => {
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    const navigation = useTypedNavigation();
    useTrackScreen('Wallet', engine.isTestnet);

    return (
        <>
            <StatusBar style={'light'} />
            <WalletComponent wallet={account} />
        </>
    );
}, true);