import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, TextInput, View, Text, TextInputProps } from "react-native";
import { GraphPoint, LineGraph } from "react-native-graph";
import Animated, { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, fromNano, toNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { useEngine } from "../../engine/Engine";
import { usePrice } from "../../engine/PriceContext";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { formatCurrency } from "../../utils/formatCurrency";
import { getSixDigitHex } from "../../utils/getSixDigitHex";
import { KnownPools } from "../../utils/KnownPools";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

const AnimatedText = Animated.createAnimatedComponent(TextInput);

export const StakingGraphFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const params = useParams<{ pool: string }>();
    const target = Address.parse(params.pool);
    const engine = useEngine();
    const pool = engine.products.whalesStakingPools.usePool(target);
    const member = pool?.member;
    const stakingChart = engine.products.whalesStakingPools.useStakingChart(target);
    const knownPool = KnownPools[params.pool];

    const points: GraphPoint[] = (stakingChart?.chart || []).map((p) => {
        return {
            value: parseFloat(fromNano(p.balance)),
            date: new Date(p.ts)
        }
    });

    const [price, currency] = usePrice();
    const [balance, setBalance] = useState(member?.balance || toNano('0'));
    const balanceShared = useSharedValue(fromNano(member?.balance || toNano('0')));
    const priceShared = useSharedValue('');

    useEffect(() => {
        balanceShared.value = parseFloat(fromNano(balance)).toFixed(2);
        if (price) {
            priceShared.value = `${formatCurrency((parseFloat(fromNano(balance)) * price.price.usd * price.price.rates[currency]).toFixed(2), currency)}`;
        }
    }, [balance]);

    useEffect(() => {
        setBalance(member?.balance || toNano('0'));
    }, [member]);

    const onPointSelected = useCallback(
        (point: GraphPoint) => {
            balanceShared.value = point.value.toFixed(2);
            if (price) {
                priceShared.value = `${formatCurrency((parseFloat(point.value.toFixed(2)) * price.price.usd * price.price.rates[currency]).toFixed(2), currency)}`;
            }
        },
        [price],
    );

    const onGraphGestureEnded = useCallback(() => {
        setBalance(member?.balance || toNano('0'));
    }, [member]);

    const animatedTonProps = useAnimatedProps(() => {
        return {
            text: `${balanceShared.value} TON`,
        };
    });

    const animatedPriceProps = useAnimatedProps(() => {
        return {
            text: `${priceShared.value}`,
        };
    });

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            // alignItems: 'center'
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('products.staking.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 0,
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('products.staking.title')}
                    </Text>
                </View>
            )}
            <View style={{
                marginHorizontal: 32
            }}>
                <Text style={[{
                    fontWeight: '600',
                    fontSize: 14, marginTop: 8
                }]}>
                    {knownPool.name}
                </Text>
                <Text style={[{
                    fontWeight: '600',
                    fontSize: 14, marginTop: 4
                }]}>
                    {
                        target.toFriendly({ testOnly: AppConfig.isTestnet }).slice(0, 6)
                        + '...'
                        + target.toFriendly({ testOnly: AppConfig.isTestnet }).slice(t.length - 8)
                    }
                </Text>
                <Text style={[{
                    fontWeight: '600',
                    fontSize: 14, marginTop: 16
                }]}>
                    {t('common.balance')}
                </Text>
                <AnimatedText
                    animatedProps={animatedTonProps as Partial<Animated.AnimateProps<TextInputProps>>}
                    style={{
                        fontSize: 30,
                        color: Theme.textColor,
                        marginRight: 8,
                        fontWeight: '800',
                        height: 40,
                        marginTop: 2
                    }}
                />
                {(price && !AppConfig.isTestnet) && (
                    <View style={[{
                        backgroundColor: Theme.accent,
                        borderRadius: 9,
                        height: 24,
                        alignSelf: 'flex-start',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        paddingVertical: 4, paddingHorizontal: 8,
                        marginTop: 6
                    }]}>
                        <AnimatedText
                            animatedProps={animatedPriceProps as Partial<Animated.AnimateProps<TextInputProps>>}
                            style={{
                                height: 40,
                                marginTop: 2,
                                color: 'white',
                                fontSize: 14,
                                fontWeight: '600',
                                textAlign: "center",
                                lineHeight: 16
                            }}
                        />
                    </View>
                )}
            </View>
            {points.length > 0 && (
                <LineGraph
                    style={[{
                        alignSelf: 'center',
                        width: '100%', aspectRatio: 1.2,
                        paddingHorizontal: 8
                    }]}
                    selectionDotShadowColor={Theme.accent}
                    verticalPadding={32}
                    lineThickness={5}
                    animated={true}
                    color={Theme.accent}
                    points={points}
                    enablePanGesture={true}
                    enableFadeInMask={true}
                    gradientFillColors={[
                        `${getSixDigitHex(Theme.accent)}00`,
                        `${getSixDigitHex(Theme.accent)}ff`,
                        `${getSixDigitHex(Theme.accent)}33`,
                        `${getSixDigitHex(Theme.accent)}33`,
                        `${getSixDigitHex(Theme.accent)}00`,
                    ]}
                    horizontalPadding={2}
                    onPointSelected={onPointSelected}
                    onGestureEnd={onGraphGestureEnded}
                    // TopAxisLabel={() => <AxisLabel x={max.x} value={max.value} />}
                    // BottomAxisLabel={() => <AxisLabel x={min.x} value={min.value} />}
                    indicatorPulsating={false}
                />
            )}
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});