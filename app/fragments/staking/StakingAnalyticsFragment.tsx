import { View, Text, Platform, Pressable } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { Address, fromNano, toNano } from "ton";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useEngine } from "../../engine/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import BN from "bn.js";
import { NominatorInfo, fetchStakingNominator } from "../../engine/api/fetchStakingNominator";
import { createBackoff } from "teslabot";
import { useDimensions } from "@react-native-community/hooks";
import { setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";
import { ValueComponent } from "../../components/ValueComponent";
import { PriceComponent } from "../../components/PriceComponent";
import { formatDate } from "../../utils/dates";

import IcGrowth from "@assets/ic-growth.svg";
import { ReAnimatedCircularProgress } from "../../components/CircularProgress/ReAnimatedCircularProgress";

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

type TimespanType = 'W' | 'M' | 'Y' | 'ALL';

const TimeLineButton = memo(({
    loading,
    current,
    timespan,
    setTimespan
}: {
    loading?: boolean,
    current: TimespanType,
    timespan: TimespanType,
    setTimespan: (newValue: TimespanType) => void
}) => {
    const { Theme } = useAppConfig();
    const isSeleted = current === timespan;

    return (
        <Pressable
            style={{
                backgroundColor: isSeleted ? Theme.accent : Theme.surfaceSecondary,
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
                    color={Theme.textThird}
                    reverse
                    infinitRotate
                    progress={0.8}
                />
            ) : (
                <Text
                    style={{
                        color: isSeleted ? Theme.textThird : Theme.textSecondary,
                        fontSize: 15, lineHeight: 20,
                        fontWeight: '500'
                    }}>
                    {timespan}
                </Text>
            )}
        </Pressable>
    );
})

const formatPoints = (points: {
    amount: BN;
    time: string;
}[]) => {
    return points.map((p, index) => {
        return {
            value: Number(fromNano(p.amount)),
            date: new Date(p.time),
        };
    })
};

const extractLabels = (points: any[], timeLine: TimespanType) => {
    const dates = points.map(p => p.date);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    if (dates.length === 0) {
        return [];
    }

    let dateFormat = 'dd.MM';
    let labelsLength = 7;

    switch (timeLine) {
        case 'W':
            dateFormat = 'ddEEE';
            break;
        case 'M':
            dateFormat = 'dd.MM';
            labelsLength = 6
            break;
        case 'Y':
            dateFormat = 'MMM';
            labelsLength = 12
            break;
        case 'ALL':
            dateFormat = 'MM.yy';
            labelsLength = 4
            break;
    }

    const labels = [];

    for (let i = 0; i < labelsLength; i++) {
        const date = new Date(minDate.getTime() + (maxDate.getTime() - minDate.getTime()) / (labelsLength - 1) * i);
        labels.push(format(date, dateFormat));
    }

    return labels;
};

export const StakingAnalyticsFragment = fragment(() => {
    const { pool } = useParams<{ pool: Address }>();
    const { Theme } = useAppConfig();
    const dimensions = useDimensions();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const stakingPoolInfo = engine.products.whalesStakingPools.usePool(pool, engine.address);
    const stakingPoolChart = engine.products.whalesStakingPools.useStakingChart(pool);
    const nominator = engine.products.whalesStakingPools.useNominatorInfo(pool, engine.address);

    const backoff = createBackoff({ onError: (e, fails) => console.warn(e.message), maxFailureCount: 5 });

    const [nominatorInfo, setNominatorInfo] = useState<NominatorInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [timespan, setTimespan] = useState<TimespanType>('W');
    const initialPointSelected = {
        balance: stakingPoolInfo?.member.balance ?? new BN(0),
        profit: nominator?.nominator?.profitAmount ?? new BN(0),
        date: new Date(),
        index: undefined as number | undefined
    }
    const [selectedPoint, setSelectedPoint] = useState(initialPointSelected);

    useEffect(() => {
        if (loading) return;
        (async () => {
            setLoading(true);
            if (timespan === 'ALL') {
                const res = await backoff(() => fetchStakingNominator({
                    nominator: engine.address,
                    pool: pool,
                    isTestnet: engine.isTestnet,
                    timeout: 120_000
                }));
                setNominatorInfo(res);
            } else if (timespan === 'W') {
                const res = await backoff(() => fetchStakingNominator({
                    nominator: engine.address,
                    pool: pool,
                    isTestnet: engine.isTestnet,
                    timespan: { start: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60 }
                }));
                setNominatorInfo(res);
            } else if (timespan === 'M') {
                const res = await backoff(() => fetchStakingNominator({
                    nominator: engine.address,
                    pool: pool,
                    isTestnet: engine.isTestnet,
                    timespan: { start: Math.floor(Date.now() / 1000) - 32 * 24 * 60 * 60 }
                }));
                console.log({ resDates: res?.nominator?.profits.map(p => new Date(p.time)) })

                setNominatorInfo(res);
            } else if (timespan === 'Y') {
                const res = await backoff(() => fetchStakingNominator({
                    nominator: engine.address,
                    pool: pool,
                    isTestnet: engine.isTestnet,
                    timespan: { start: Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60 },
                    timeout: 120_000
                }));
                setNominatorInfo(res);
            }
            setLoading(false);
        })();
    }, [timespan]);

    useEffect(() => {
        setSelectedPoint(initialPointSelected);
    }, [nominatorInfo]);

    const chart = useMemo(() => {
        const newPoints = formatPoints(nominatorInfo?.nominator?.profits ?? []);
        if (loading) {
            let arr = new Array(7).fill(0);
            let start = Date.now() - 7 * 24 * 60 * 60 * 1000;
            switch (timespan) {
                case 'W':
                    return {
                        data: arr.map(() => Math.random()),
                        labels: extractLabels(
                            arr.map((value, index) => ({
                                value: 0,
                                date: new Date(start + index * 24 * 60 * 60 * 1000)
                            })),
                            'W'
                        )
                    }
                case 'M':
                    arr = new Array(15).fill(0);
                    start = Date.now() - 30 * 24 * 60 * 60 * 1000;
                    return {
                        data: arr.map(() => Math.random()),
                        labels: extractLabels(
                            arr.map((value, index) => ({
                                value: 0,
                                date: new Date(start + index * 24 * 60 * 60 * 1000)
                            })),
                            'M'
                        )
                    }
                case 'Y':
                    arr = new Array(30).fill(0);
                    start = Date.now() - 365 * 24 * 60 * 60 * 1000;
                    return {
                        data: arr.map(() => Math.random()),
                        labels: extractLabels(
                            arr.map((value, index) => ({
                                value: 0,
                                date: new Date(start + index * (365 / 6) * 24 * 60 * 60 * 1000)
                            })),
                            'Y'
                        )
                    }
                case 'ALL':
                    arr = new Array(30).fill(0);
                    start = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
                    return {
                        data: arr.map(() => Math.random()),
                        labels: extractLabels(
                            arr.map((value, index) => ({
                                value: 0,
                                date: new Date(start + index * (2 * 365 / 6) * 24 * 60 * 60 * 1000)
                            })),
                            'ALL'
                        )
                    }
            }
        };
        return {
            data: newPoints.map(p => p.value),
            labels: extractLabels(newPoints, timespan)
        }
    }, [nominatorInfo, loading, timespan]);

    const onDataPointClick = useCallback((point: {
        index: number;
        value: number;
        dataset: Dataset;
        x: number;
        y: number;
        getColor: (opacity: number) => string;
    }) => {
        if (stakingPoolChart && stakingPoolChart.chart.length > 0) {
            const pointDate = new Date(nominatorInfo?.nominator?.profits[point.index].time ?? 0);

            const reversed = stakingPoolChart.chart.reverse();

            const nearestBalancePoint = reversed.find((cPoint) => {
                const prevDate = new Date(cPoint.ts);
                const prevDiff = Math.abs(pointDate.getTime() - prevDate.getTime());

                return prevDiff < 24 * 60 * 60 * 1000 ? cPoint : undefined
            });

            if (nearestBalancePoint) {
                try {
                    const bal = new BN(nearestBalancePoint.balance);
                    setSelectedPoint({
                        balance: bal,
                        profit: nominatorInfo?.nominator?.profits[point.index].amount ?? new BN(0),
                        date: pointDate,
                        index: point.index
                    });
                } catch {
                    // ignore
                }
            }
        }
    }, [stakingPoolChart, nominatorInfo]);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(Platform.select({
                ios: 'light',
                android: Theme.style === 'dark' ? 'light' : 'dark',
                default: 'light',
            }));
        }, 10);
    });

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                title={t('products.staking.analytics.analyticsTitle')}
                onClosePressed={navigation.goBack}
            />
            <View style={{
                backgroundColor: Theme.surfaceSecondary,
                borderRadius: 20,
                marginHorizontal: 16,
                paddingBottom: 20,
                paddingTop: 16,
                paddingHorizontal: 20,
            }}>
                <Text style={{ color: Theme.textSecondary }}>
                    {formatDate(selectedPoint.date.getTime() / 1000)}
                </Text>
                <Text style={{
                    fontSize: 27,
                    color: Theme.textPrimary,
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
                        color: Theme.textPrimary,
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
                            style={{ backgroundColor: Theme.divider }}
                            textStyle={{ color: Theme.textPrimary }}
                        />
                        <View style={{
                            backgroundColor: Theme.divider,
                            paddingHorizontal: 6, paddingVertical: 4,
                            alignSelf: 'flex-start', flexDirection: 'row',
                            borderRadius: 20, alignItems: 'center',
                            flexShrink: 1,
                            marginLeft: 10
                        }}>
                            <IcGrowth style={{ height: 16, width: 16, marginRight: 6 }} width={16} height={16} />
                            <PriceComponent
                                textStyle={{
                                    color: Theme.textPrimary,
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
                        color: () => loading ? Theme.border : Theme.accent,
                        labelColor: () => Theme.textSecondary,
                        propsForDots: {
                            opacity: 1
                        },
                        propsForBackgroundLines: {
                            strokeDasharray: '0',
                            stroke: Theme.border
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
                            return Theme.accent
                        }
                        return 'transparent'
                    }}
                    yAxisInterval={1}
                    formatXLabel={(value) => {
                        console.log({ value });
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
                                    backgroundColor: Theme.accent
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
                                        color: Theme.textSecondary
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
                <TimeLineButton loading={loading} current={timespan} timespan={'W'} setTimespan={setTimespan} />
                <TimeLineButton loading={loading} current={timespan} timespan={'M'} setTimespan={setTimespan} />
                <TimeLineButton loading={loading} current={timespan} timespan={'Y'} setTimespan={setTimespan} />
                <TimeLineButton loading={loading} current={timespan} timespan={'ALL'} setTimespan={setTimespan} />
            </View>
        </View>
    )
});