import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, TextInput, View, Text, Pressable } from "react-native";
import { GraphPoint, LineGraph, SelectionDotProps } from "react-native-graph";
import Animated, { useAnimatedProps, useAnimatedRef, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { formatDate } from "../../utils/dates";
import { formatCurrency } from "../../utils/formatCurrency";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import * as Haptics from 'expo-haptics';
import { useAccountLite, useAccountTransactions, useClient4, useNetwork, usePrice, useSelectedAccount, useTheme } from "../../engine/hooks";
import { fromNano, toNano } from "@ton/core";
import { fetchAddressBalanceChart } from "../../engine/api/fetchAddressBalanceChart";

const timeRangePoints = [
    { label: '1D', index: 0, from: 24 * 60 * 60, hoursInterval: 0.8 },
    { label: '1W', index: 1, from: 7 * 24 * 60 * 60, hoursInterval: 5.6 },
    { label: '1M', index: 2, from: 30 * 24 * 60 * 60, hoursInterval: 24 },
    { label: '3M', index: 3, from: 90 * 24 * 60 * 60, hoursInterval: 3 * 24 },
    { label: '6M', index: 4, from: 180 * 24 * 60 * 60, hoursInterval: 6 * 24 },
    { label: '1Y', index: 5, from: 365 * 24 * 60 * 60, hoursInterval: 12 * 24 }
]

Animated.addWhitelistedNativeProps({ text: true });

const AnimatedText = Animated.createAnimatedComponent(TextInput);

export const AccountBalanceGraphFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const selected = useSelectedAccount();
    const account = useAccountLite(selected!.address);
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    const txs = useAccountTransactions(client, selected!.addressString)?.data;

    const [balanceChart, setBalanceChart] = useState<{
        chart: {
            balance: string;
            ts: number;
            diff: string;
        }[]
    }>({ chart: [] });
    const [price, currency] = usePrice();

    const points: GraphPoint[] = useMemo(() => {
        const temp = (balanceChart?.chart || []).map((p) => {
            return {
                value: parseFloat(fromNano(p.balance)),
                date: new Date(p.ts)
            }
        });

        if (account && txs && temp.length > 0) {
            const latest = txs[0];

            if (latest && (latest.base.time * 1000 > temp[temp.length - 1].date.getTime())) {
                temp.push({
                    value: parseFloat(fromNano(account.balance)),
                    date: new Date(latest.base.time * 1000)
                });
            }
        }

        return temp;
    }, [balanceChart, account, txs]);

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

        // Update chart
        if (!loading) {
            (async () => {
                setLoading(true);
                const newChart = await fetchAddressBalanceChart(
                    client,
                    selected!.address,
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
                    animatedProps={animatedPointerProps as any}
                    style={{
                        color: theme.textSecondary,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '500',
                    }}
                    value={animatedPointerProps.text}
                />
                <AnimatedText
                    animatedProps={animatedTonProps as any}
                    style={{
                        fontSize: 32, lineHeight: 40,
                        color: theme.textPrimary,
                        fontWeight: '600',
                    }}
                    value={animatedTonProps.text}
                    editable={false}
                />
                <AnimatedText
                    animatedProps={animatedPriceProps as any}
                    style={{
                        marginTop: 2,
                        color: theme.accentGreen,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '400',
                    }}
                    value={animatedPriceProps.text}
                    editable={false}
                />
            </View>
            {points.length > 0 && (
                <View style={{ margin: 16, borderRadius: 20, backgroundColor: theme.border }}>
                    <LineGraph
                        style={[{
                            alignSelf: 'center',
                            width: '100%', aspectRatio: 1,
                        }]}
                        selectionDotShadowColor={theme.accent}
                        lineThickness={5}
                        animated={true}
                        color={loading ? theme.textSecondary : theme.accent}
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
                            color: theme.textSecondary,
                            fontWeight: '500',
                            fontSize: 17, lineHeight: 24,
                        }}>
                            {loading ? '...' : formatDate(Math.floor(points[0].date.getTime() / 1000), 'dd MMM')}
                        </Text>
                        <Text style={{
                            color: theme.textSecondary,
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
                                backgroundColor: theme.border,
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
                                    color: theme.textSecondary,
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