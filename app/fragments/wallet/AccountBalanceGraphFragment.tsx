import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, TextInput, View, Text, TextInputProps, Pressable } from "react-native";
import { GraphPoint, LineGraph } from "react-native-graph";
import Animated, { useAnimatedProps, useAnimatedRef, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fromNano, toNano } from "ton";
import { useEngine } from "../../engine/Engine";
import { usePrice } from "../../engine/PriceContext";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { formatDate } from "../../utils/dates";
import { formatCurrency } from "../../utils/formatCurrency";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppConfig } from "../../utils/AppConfigContext";
import { ScreenHeader } from "../../components/ScreenHeader";
import * as Haptics from 'expo-haptics';
import { fetchAddressBalanceChart } from "../../engine/sync/startAccountBalanceChartSync";

const timeRangePoints = [
    { label: '1D', index: 0, from: 24 * 60 * 60, hoursInterval: 1 },
    { label: '1W', index: 1, from: 7 * 24 * 60 * 60, hoursInterval: 6 },
    { label: '1M', index: 2, from: 30 * 24 * 60 * 60, hoursInterval: 24 },
    { label: '3M', index: 3, from: 90 * 24 * 60 * 60, hoursInterval: 24 * 3 },
    { label: '6M', index: 4, from: 180 * 24 * 60 * 60, hoursInterval: 24 * 3 * 2 },
    { label: '1Y', index: 5, from: 365 * 24 * 60 * 60, hoursInterval: 24 * 3 * 4 },
]

const AnimatedText = Animated.createAnimatedComponent(TextInput);

export const AccountBalanceGraphFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const engine = useEngine();
    const account = engine.products.main.useAccount();
    const chart = engine.products.main.useAccountBalanceChart();
    const [balanceChart, setBalanceChart] = useState(chart);
    const last = engine.persistence.fullAccounts.item(engine.address).value?.last;
    const [price, currency] = usePrice();

    const points: GraphPoint[] = useMemo(() => {
        const temp = (balanceChart?.chart || []).map((p) => {
            return {
                value: parseFloat(fromNano(p.balance)),
                date: new Date(p.ts)
            }
        });

        if (account && last) {
            const latest = engine.transactions.get(engine.address, last.lt.toString(10));

            if (latest && (latest.time * 1000 > temp[temp.length - 1].date.getTime())) {
                temp.push({
                    value: parseFloat(fromNano(account.balance)),
                    date: new Date(account.transactions[0].time * 1000)
                });
            }
        }

        return temp;
    }, [balanceChart, account]);

    const rate = useMemo(() => {
        return price ? price.price.usd * price.price.rates[currency] : 0;
    }, [price, currency]);

    const balance = useMemo(() => {
        return fromNano(account?.balance || toNano('0'));
    }, [account]);

    const balanceInCurrency = useMemo(() => {
        return formatCurrency((parseFloat(balance) * rate).toFixed(2), currency);
    }, [balance, rate]);

    const balanceShared = useSharedValue(balance);
    const pointerDate = useSharedValue(formatDate(Math.floor(Date.now() / 1000), 'dd MMM'));
    const priceShared = useSharedValue(balanceInCurrency);

    const onPointSelected = useCallback(
        (point: GraphPoint) => {
            balanceShared.value = point.value.toFixed(2);
            priceShared.value = formatCurrency((parseFloat(point.value.toFixed(2)) * rate).toFixed(2), currency);
            pointerDate.value = formatDate(Math.floor(point.date.getTime() / 1000), 'dd MMM');
        },
        [rate],
    );

    const onGraphGestureEnded = useCallback(() => {
        balanceShared.value = parseFloat(balance).toFixed(2);
        priceShared.value = formatCurrency((parseFloat(balance) * rate).toFixed(2), currency);
        pointerDate.value = formatDate(Math.floor(Date.now() / 1000), 'dd MMM');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [balance, rate]);

    const animatedTonProps = useAnimatedProps(() => {
        return { text: `${balanceShared.value} TON` };
    });

    const animatedPriceProps = useAnimatedProps(() => {
        return { text: priceShared.value };
    });

    const animatedPointerProps = useAnimatedProps(() => {
        return { text: pointerDate.value };
    });

    useEffect(() => {
        balanceShared.value = parseFloat(balance).toFixed(2);
        priceShared.value = balanceInCurrency;
    }, [balance, balanceInCurrency]);

    const [timeRange, setTimeRange] = useState<{ label: string, index: number }>(timeRangePoints[2]);
    const [loading, setLoading] = useState(false);
    const selectorRef = useAnimatedRef<Animated.View>();
    const position = useSharedValue(0);

    const animatedSelectorStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0, bottom: 0,
            left: withSpring(position.value, { duration: 500 })
        }
    });

    const onTimeRangeChanged = useCallback((index: number) => {
        if (index === 0) {
            position.value = 4;
        } else {
            position.value = 48 * index + 4;
        }
    }, []);

    useEffect(() => {
        // Animate selector to the right position
        onTimeRangeChanged(timeRange.index);

        if (timeRange.index === 2) {
            setBalanceChart(chart);
            setLoading(false);
            return;
        }
        // Update chart
        if (!loading) {
            (async () => {
                setLoading(true);
                const newChart = await fetchAddressBalanceChart(
                    engine.client4,
                    engine.address,
                    timeRangePoints[timeRange.index].from * 1000,
                    timeRangePoints[timeRange.index].hoursInterval
                )
                setBalanceChart(newChart);
                setLoading(false);
            })();
        }

    }, [timeRange]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom + 16,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader title={t('common.balance')} onClosePressed={navigation.goBack} />
            <View style={{ margin: 16 }}>
                <AnimatedText
                    animatedProps={animatedPointerProps as Partial<Animated.AnimateProps<TextInputProps>>}
                    style={{
                        color: Theme.darkGrey,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '500',
                    }}
                />
                <AnimatedText
                    animatedProps={animatedTonProps as Partial<Animated.AnimateProps<TextInputProps>>}
                    style={{
                        fontSize: 32, lineHeight: 40,
                        color: Theme.textColor,
                        fontWeight: '600',
                    }}
                    editable={false}
                />
                <AnimatedText
                    animatedProps={animatedPriceProps as Partial<Animated.AnimateProps<TextInputProps>>}
                    style={{
                        marginTop: 2,
                        color: Theme.green,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '400',
                    }}
                    editable={false}
                />
            </View>
            {points.length > 0 && (
                <View style={{ margin: 16, borderRadius: 20, backgroundColor: Theme.lightGrey }}>
                    <LineGraph
                        style={[{
                            alignSelf: 'center',
                            width: '100%', aspectRatio: 1,
                        }]}
                        selectionDotShadowColor={Theme.accent}
                        lineThickness={5}
                        animated={true}
                        color={loading ? Theme.darkGrey : Theme.accent}
                        points={points}
                        horizontalPadding={32}
                        verticalPadding={32}
                        enablePanGesture={true}
                        enableFadeInMask={true}
                        panGestureDelay={0}
                        onGestureStart={Haptics.selectionAsync}
                        onPointSelected={onPointSelected}
                        onGestureEnd={onGraphGestureEnded}
                        indicatorPulsating={false}
                    />
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 16,
                        paddingHorizontal: 16,
                        paddingBottom: 16,
                    }}>
                        <Text style={{
                            color: Theme.darkGrey,
                            fontWeight: '500',
                            fontSize: 17, lineHeight: 24,
                        }}>
                            {loading ? '...' : formatDate(Math.floor(points[0].date.getTime() / 1000), 'dd MMM')}
                        </Text>
                        <Text style={{
                            color: Theme.darkGrey,
                            fontWeight: '500',
                            fontSize: 17, lineHeight: 24,
                        }}>
                            {loading ? '...' : formatDate(Math.floor(points[points.length - 1].date.getTime() / 1000), 'dd MMM')}
                        </Text>
                    </View>
                </View>
            )}
            <View style={{ flexGrow: 1 }} />
            <View style={{
                width: '100%',
                justifyContent: 'center', alignItems: 'center',
            }}>
                <View style={{ flexDirection: 'row', }}>
                    <Animated.View
                        ref={selectorRef}
                        style={[
                            {
                                backgroundColor: Theme.lightGrey,
                                borderRadius: 12,
                                width: 40
                            },
                            animatedSelectorStyle
                        ]}
                    />
                    {timeRangePoints.map((point, index) => {
                        return (
                            <Pressable
                                onPress={() => setTimeRange(timeRangePoints[index])}
                                style={{
                                    justifyContent: 'center', alignItems: 'center',
                                    width: 48, height: 48
                                }}
                            >
                                <Text style={{
                                    color: Theme.darkGrey,
                                }}>
                                    {point.label}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>
            </View>
            <View style={{ flexGrow: 1 }} />
        </View>
    );
});