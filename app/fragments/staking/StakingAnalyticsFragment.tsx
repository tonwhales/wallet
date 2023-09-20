import { View, Text, Platform } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { Address, fromNano } from "ton";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEngine } from "../../engine/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { useEffect, useState } from "react";
import { LineChart } from "react-native-gifted-charts"
import { formatDate, getDateKey } from "../../utils/dates";
import { format } from "date-fns";
import BN from "bn.js";
import { fetchStakingNominator } from "../../engine/api/fetchStakingNominator";
import { createBackoff } from "teslabot";
import { useDimensions } from "@react-native-community/hooks";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";

export const StakingAnalyticsFragment = fragment(() => {
    const { pool } = useParams<{ pool: Address }>();
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const dimensions = useDimensions();
    const engine = useEngine();
    const navigation = useTypedNavigation();

    const backoff = createBackoff({ onError: (e, fails) => console.warn(e.message), maxFailureCount: 5 });

    const customLabel = (val: string) => {
        return (
            <View style={{ width: 70, marginLeft: 7 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{val}</Text>
            </View>
        );
    };

    const formatPoints = (points: {
        amount: BN;
        time: string;
    }[]) => {
        return points.map((p, index) => {
            console.log({ amount: Number(fromNano(p.amount)) })
            const labelComponent = index % Math.floor(points.length / 4) === 0 ? customLabel(format(new Date(p.time), 'dd MMM')) : undefined;
            return ({
                value: Number(fromNano(p.amount)),
                labelComponent: () => labelComponent
            });
        })
    };

    const [points, setPoints] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [timeSpan, setTimeSpan] = useState<'W' | 'M' | 'Y' | 'ALL'>('W');

    useEffect(() => {
        if (loading) return;
        (async () => {
            setLoading(true);
            if (timeSpan === 'ALL') {
                const res = await backoff(() => fetchStakingNominator({
                    nominator: engine.address,
                    pool: pool,
                    isTestnet: engine.isTestnet,
                }));
                console.log({ res });
                const newPoints = formatPoints(res.nominator?.profits ?? []);
                setPoints(newPoints);
            } else if (timeSpan === 'W') {
                const res = await backoff(() => fetchStakingNominator({
                    nominator: engine.address,
                    pool: pool,
                    isTestnet: engine.isTestnet,
                    timespan: {
                        start: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
                    }
                }));
                console.log({ res: res.nominator?.profits });
                const newPoints = formatPoints(res.nominator?.profits ?? []);
                setPoints(newPoints);
            }
            setLoading(false);
        })();
    }, [timeSpan]);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(Platform.OS === 'ios' ? 'light' : 'dark');
        }, 10);
    });

    console.log({ points, max: points?.reduce((max, p) => Math.max(max, p.value), 0) });

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                title={t('products.staking.analytics.analyticsTitle')}
                onClosePressed={() => navigation.goBack()}
            />
            {points.length > 0 && (
                <LineChart
                    // isAnimated
                    thickness={3}
                    color={Theme.accent}
                    maxValue={points ? points?.reduce((max, p) => Math.max(max, p.value), 0) : 0}
                    noOfSections={3}
                    showVerticalLines
                    width={dimensions.screen.width - 32}
                    adjustToWidth
                    // animateOnDataChange
                    // animationDuration={1000}
                    // onDataChangeAnimationDuration={300}
                    areaChart
                    hideRules
                    data={points}
                    hideDataPoints
                    startFillColor={Theme.accent}
                    endFillColor={Theme.transparent}
                    startOpacity={0.4}
                    endOpacity={0.1}
                    rulesColor={Theme.border}
                    rulesType={'solid'}
                    initialSpacing={16}
                    endSpacing={16}
                    spacing={Math.floor((dimensions.screen.width - 32) / 5)}
                    // disableScroll
                    yAxisColor={Theme.transparent}
                    xAxisColor={Theme.transparent}
                />
            )}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 10,
                marginTop: 100,
                opacity: loading ? 0.5 : 1
            }}>
                <View style={{
                    backgroundColor: timeSpan === 'W' ? Theme.accent : Theme.surfaceSecondary,
                    borderRadius: 10,
                    paddingHorizontal: 16, paddingVertical: 6,
                    marginHorizontal: 6,
                    flex: 1,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Text style={{ color: Theme.textThird, fontSize: 15, lineHeight: 20, fontWeight: '500' }}>{'W'}</Text>
                </View>
                <View style={{
                    backgroundColor: timeSpan === 'M' ? Theme.accent : Theme.surfaceSecondary,
                    borderRadius: 10,
                    paddingHorizontal: 16, paddingVertical: 6,
                    marginHorizontal: 6,
                    flex: 1,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Text style={{ color: Theme.textThird, fontSize: 15, lineHeight: 20, fontWeight: '500' }}>{'M'}</Text>
                </View>
                <View style={{
                    backgroundColor: timeSpan === 'Y' ? Theme.accent : Theme.surfaceSecondary,
                    borderRadius: 10,
                    paddingHorizontal: 16, paddingVertical: 6,
                    marginHorizontal: 6,
                    flex: 1,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Text style={{ color: Theme.textThird, fontSize: 15, lineHeight: 20, fontWeight: '500' }}>{'Y'}</Text>
                </View>
                <View style={{
                    backgroundColor: timeSpan === 'ALL' ? Theme.accent : Theme.surfaceSecondary,
                    borderRadius: 10,
                    paddingHorizontal: 16, paddingVertical: 6,
                    marginHorizontal: 6,
                    flex: 1,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Text style={{ color: Theme.textThird, fontSize: 15, lineHeight: 20, fontWeight: '500' }}>{'ALL'}</Text>
                </View>
            </View>

        </View>
    )
});