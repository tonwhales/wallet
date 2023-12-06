import { View, Text, Platform, Pressable } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useDimensions } from "@react-native-community/hooks";
import { LineChart } from "react-native-chart-kit";
import { ValueComponent } from "../../components/ValueComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { formatDate } from "../../utils/dates";
import { ReAnimatedCircularProgress } from "../../components/CircularProgress/ReAnimatedCircularProgress";
import { useNetwork, useSelectedAccount, useStakingPool, useTheme } from "../../engine/hooks";
import { Address, fromNano } from "@ton/core";
import { useNominatorInfo } from "../../engine/hooks/staking/useNominatorInfo";
import { NominatorPeriod } from "../../engine/api/fetchStakingNominator";

import IcGrowth from "@assets/ic-growth.svg";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Dataset = {
    /** The data corresponding to the x-axis label. */
    data: number[];
    /** A function returning the color of the stroke given an input opacity value. */
    color?: (opacity: number) => string;
    /** A function returning array of the colors of the stroke given an input opacity value for each data value. */
    colors?: Array<(opacity: number) => string>;
    /** The width of the stroke. Defaults to 2. */
    strokeWidth?: number;
    /** A boolean indicating whether to render dots for this line */
    withDots?: boolean;
    /** Override of LineChart's withScrollableDot property just for this dataset */
    withScrollableDot?: boolean;
    /** Unique key **/
    key?: string | number;
    /** Stroke Dash Array */
    strokeDashArray?: number[];
    /** Stroke Dash Offset */
    strokeDashOffset?: number;
}

const TimeLineButton = memo(({
    loading,
    current,
    timespan,
    setTimespan
}: {
    loading?: boolean,
    current: NominatorPeriod,
    timespan: NominatorPeriod,
    setTimespan: (newValue: NominatorPeriod) => void
}) => {
    const theme = useTheme();
    const isSeleted = current === timespan;

    return (
        <Pressable
            style={{
                backgroundColor: isSeleted ? theme.accent : theme.surfaceOnElevation,
                borderRadius: 10,
                paddingHorizontal: 16, paddingVertical: 6,
                marginHorizontal: 6,
                flex: 1,
                justifyContent: 'center', alignItems: 'center'
            }}
            disabled={loading}
            onPress={() => setTimespan(timespan)}
        >
            {(loading && isSeleted) ? (
                <ReAnimatedCircularProgress
                    size={14}
                    color={theme.textThird}
                    reverse
                    infinitRotate
                    progress={0.8}
                />
            ) : (
                <Text
                    style={{
                        color: isSeleted ? theme.textOnsurfaceOnDark : theme.textSecondary,
                        fontSize: 15, lineHeight: 20,
                        fontWeight: '500'
                    }}>
                    {t(`products.staking.analytics.labels.${timespan}`)}
                </Text>
            )}
        </Pressable>
    );
})

const formatPoints = (points: {
    amount: bigint;
    time: string;
}[]) => {
    return points.map((p, index) => {
        return {
            value: Number(fromNano(p.amount)),
            date: new Date(p.time),
        };
    })
};

const extractLabels = (points: any[], timeLine: NominatorPeriod) => {
    const dates = points.map(p => p.date);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    if (dates.length === 0) {
        return [];
    }

    let dateFormat = 'dd.MM';
    let max = 7;

    switch (timeLine) {
        case 'week':
            dateFormat = 'ddEEE';
            break;
        case 'month':
            dateFormat = 'dd.MM';
            max = 6
            break;
        case 'year':
            dateFormat = 'MMM';
            max = 12
            break;
        case 'allTime':
            dateFormat = 'MM.yy';
            max = 4
            break;
    }

    const labels = [];

    for (let i = 0; i < (max <= dates.length ? max : dates.length); i++) {
        const date = new Date(minDate.getTime() + (maxDate.getTime() - minDate.getTime()) / (max - 1) * i);
        labels.push(format(date, dateFormat));
    }

    return labels;
};

export const StakingAnalyticsFragment = fragment(() => {
    const { pool } = useParams<{ pool: Address }>();
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const dimensions = useDimensions();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const stakingPoolInfo = useStakingPool(pool);

    const [timespan, setTimespan] = useState<NominatorPeriod>('week');

    const nominatorInfo = useNominatorInfo(pool, selected!.address, timespan, isTestnet);
    const data = nominatorInfo.data;
    const loading = nominatorInfo.isLoading;

    const initialPointSelected = {
        balance: stakingPoolInfo?.member?.balance ?? 0n,
        profit: data?.nominator?.profitAmount ?? 0n,
        date: new Date(),
        index: undefined as number | undefined
    }

    const [selectedPoint, setSelectedPoint] = useState(initialPointSelected);

    useEffect(() => {
        setSelectedPoint(initialPointSelected);
    }, [data]);

    const chart = useMemo(() => {
        const newPoints = formatPoints(data?.nominator?.profits ?? []);
        if (loading) {
            let arr = new Array(7).fill(0);
            let start = Date.now() - 7 * 24 * 60 * 60 * 1000;
            switch (timespan) {
                case 'week':
                    return {
                        data: arr.map(() => Math.random()),
                        labels: extractLabels(
                            arr.map((value, index) => ({
                                value: 0,
                                date: new Date(start + index * 24 * 60 * 60 * 1000)
                            })),
                            timespan
                        )
                    }
                case 'month':
                    arr = new Array(15).fill(0);
                    start = Date.now() - 30 * 24 * 60 * 60 * 1000;
                    return {
                        data: arr.map(() => Math.random()),
                        labels: extractLabels(
                            arr.map((value, index) => ({
                                value: 0,
                                date: new Date(start + index * 24 * 60 * 60 * 1000)
                            })),
                            timespan
                        )
                    }
                case 'year':
                    arr = new Array(30).fill(0);
                    start = Date.now() - 365 * 24 * 60 * 60 * 1000;
                    return {
                        data: arr.map(() => Math.random()),
                        labels: extractLabels(
                            arr.map((value, index) => ({
                                value: 0,
                                date: new Date(start + index * (365 / 6) * 24 * 60 * 60 * 1000)
                            })),
                            timespan
                        )
                    }
                case 'allTime':
                    arr = new Array(30).fill(0);
                    start = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
                    return {
                        data: arr.map(() => Math.random()),
                        labels: extractLabels(
                            arr.map((value, index) => ({
                                value: 0,
                                date: new Date(start + index * (2 * 365 / 6) * 24 * 60 * 60 * 1000)
                            })),
                            timespan
                        )
                    }
            }
        };
        return {
            data: newPoints.length === 0 ? [0] : newPoints.map(p => p.value),
            labels: extractLabels(newPoints, timespan)
        }
    }, [data, loading, timespan]);

    const onDataPointClick = useCallback((point: {
        index: number;
        value: number;
        dataset: Dataset;
        x: number;
        y: number;
        getColor: (opacity: number) => string;
    }) => {
        // TODO: implement
        // if (stakingPoolChart && stakingPoolChart.chart.length > 0) {
        //     const pointDate = new Date(data?.nominator?.profits[point.index].time ?? 0);

        //     const reversed = stakingPoolChart.chart.reverse();

        //     const nearestBalancePoint = reversed.find((cPoint) => {
        //         const prevDate = new Date(cPoint.ts);
        //         const prevDiff = Math.abs(pointDate.getTime() - prevDate.getTime());

        //         return prevDiff < 24 * 60 * 60 * 1000 ? cPoint : undefined
        //     });

        //     if (nearestBalancePoint) {
        //         try {
        //             const bal = new BN(nearestBalancePoint.balance);
        //             setSelectedPoint({
        //                 balance: bal,
        //                 profit: data?.nominator?.profits[point.index].amount ?? new BN(0),
        //                 date: pointDate,
        //                 index: point.index
        //             });
        //         } catch {
        //             // ignore
        //         }
        //     }
        // }
    }, [data]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('products.staking.analytics.analyticsTitle')}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
            <View style={{
                backgroundColor: theme.surfaceOnElevation,
                borderRadius: 20,
                marginHorizontal: 16,
                paddingBottom: 20,
                paddingTop: 16,
                paddingHorizontal: 20,
                marginTop: 22
            }}>
                <Text style={{ color: theme.textSecondary }}>
                    {formatDate(selectedPoint.date.getTime() / 1000)}
                </Text>
                <Text style={{
                    fontSize: 27,
                    color: theme.textPrimary,
                    marginRight: 8,
                    fontWeight: '500',
                    lineHeight: 32
                }}>
                    <ValueComponent
                        precision={4}
                        value={selectedPoint.balance}
                        centFontStyle={{ opacity: 0.5 }}
                    />
                    <Text style={{
                        fontSize: 17,
                        lineHeight: Platform.OS === 'ios' ? 24 : undefined,
                        color: theme.textPrimary,
                        marginRight: 8,
                        fontWeight: '500',
                        opacity: 0.5
                    }}>{' TON'}</Text>
                </Text>
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    marginTop: 10
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <PriceComponent
                            amount={selectedPoint.balance}
                            style={{ backgroundColor: theme.divider }}
                            textStyle={{ color: theme.textPrimary }}
                            theme={theme}
                        />
                        <View style={{
                            backgroundColor: theme.divider,
                            paddingHorizontal: 6, paddingVertical: 4,
                            alignSelf: 'flex-start', flexDirection: 'row',
                            borderRadius: 20, alignItems: 'center',
                            flexShrink: 1,
                            marginLeft: 10
                        }}>
                            <IcGrowth style={{ height: 16, width: 16, marginRight: 6 }} width={16} height={16} />
                            <PriceComponent
                                textStyle={{
                                    color: theme.textPrimary,
                                    fontWeight: '500',
                                    fontSize: 15, lineHeight: 20,
                                    textAlign: 'right'
                                }}
                                prefix={'+'}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    justifyContent: 'center', alignItems: 'center',
                                    paddingLeft: 0,
                                    height: undefined,
                                }}
                                theme={theme}
                                amount={selectedPoint.profit}
                            />
                        </View>
                    </View>
                </View>
            </View>
            <View>
                <LineChart
                    data={{
                        labels: chart.labels,
                        datasets: [{ data: chart.data, withDots: true }],
                    }}
                    width={dimensions.screen.width - 16}
                    height={238 + 64}
                    transparent
                    chartConfig={{
                        decimalPlaces: 2, // optional, defaults to 2dp
                        color: () => loading ? theme.border : theme.accent,
                        labelColor: () => theme.textSecondary,
                        propsForDots: {
                            opacity: 1
                        },
                        propsForBackgroundLines: {
                            strokeDasharray: '0',
                            stroke: theme.border
                        },
                        fillShadowGradientFromOpacity: 0.1,
                        fillShadowGradientToOpacity: 0,
                    }}
                    onDataPointClick={onDataPointClick}
                    bezier
                    withHorizontalLines={false}
                    style={{
                        marginTop: 32,
                        paddingRight: 32,
                        paddingLeft: 0,
                        marginHorizontal: 16,
                    }}
                    withVerticalLabels={false}
                    withHorizontalLabels={false}
                    hidePointsAtIndex={[chart.labels.length - 1]}
                    getDotColor={(dataPoint, index) => {
                        if (!loading && index === selectedPoint.index) {
                            return theme.accent
                        }
                        return 'transparent'
                    }}
                    yAxisInterval={1}
                    formatXLabel={(value) => {
                        if (loading) {
                            return '';
                        }
                        return value;
                        // return chart.labels[index];
                    }}
                    segments={7}
                    renderDotContent={({ x, y, index }) => {
                        if (index !== selectedPoint.index || loading) {
                            return null
                        }

                        return (
                            <View style={{
                                position: 'absolute',
                                top: 0,
                                left: x,
                            }}>
                                <View style={{
                                    width: 1,
                                    height: 238,
                                    backgroundColor: theme.accent
                                }} />
                            </View>
                        )
                    }}
                />
                {!loading && (
                    <View style={{
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        position: 'absolute', top: 238 + 44,
                        justifyContent: 'space-between', alignItems: 'center',
                        width: '100%',
                    }}>
                        {chart.labels.map((label, index) => {
                            return (
                                <Text
                                    key={index}
                                    style={{
                                        fontSize: 12,
                                        fontWeight: '400',
                                        color: theme.textSecondary
                                    }}
                                >
                                    {label}
                                </Text>
                            )
                        })}
                    </View>
                )}
            </View>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 10,
                marginTop: 22,
                opacity: loading ? 0.9 : 1
            }}>
                <TimeLineButton loading={loading} current={timespan} timespan={'week'} setTimespan={setTimespan} />
                <TimeLineButton loading={loading} current={timespan} timespan={'month'} setTimespan={setTimespan} />
                <TimeLineButton loading={loading} current={timespan} timespan={'year'} setTimespan={setTimespan} />
                <TimeLineButton loading={loading} current={timespan} timespan={'allTime'} setTimespan={setTimespan} />
            </View>
        </View>
    )
});