import { View, Text, Pressable, SectionList, Platform } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { memo, useMemo } from "react";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { formatDate, formatTime } from "../../utils/dates";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NominatorOperation } from "../../engine/api/fetchStakingNominator";
import { useNetwork, useNominatorInfo, useSelectedAccount, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";

import IcDeposit from "@assets/ic-top-up.svg";
import IcWithdraw from "@assets/ic-tx-in.svg";
import { StatusBar } from "expo-status-bar";

export const StakingOperationComponent = memo(({ op }: { op: NominatorOperation & { type: 'withdraw' | 'deposit' } }) => {
    const theme = useTheme();
    return (
        <Pressable
            style={{ paddingVertical: 20 }}
        >
            <View style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <View style={{
                    width: 46, height: 46,
                    borderRadius: 23,
                    borderWidth: 0, marginRight: 10,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: theme.surfaceOnElevation
                }}>
                    {op.type === 'deposit' ? (
                        <IcDeposit
                            width={32}
                            height={32}
                        />
                    ) : (
                        <IcWithdraw
                            width={32}
                            height={32}
                        />
                    )}
                </View>
                <View style={{ flex: 1, marginRight: 4 }}>
                    <Text
                        style={{ color: theme.textPrimary, fontSize: 17, fontWeight: '600', lineHeight: 24, flexShrink: 1 }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {op.type === 'deposit' ? t('products.staking.actions.top_up') : t('products.staking.actions.withdraw')}
                    </Text>
                    <Text
                        style={{ color: theme.textSecondary, fontSize: 15, marginRight: 8, lineHeight: 20, fontWeight: '400', marginTop: 2 }}
                        ellipsizeMode="middle"
                        numberOfLines={1}
                    >
                        {formatTime(new Date(op.time).getTime() / 1000)}
                    </Text>
                </View>
                <View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text
                            style={{
                                color: op.type === 'deposit'
                                    ? theme.accentGreen
                                    : theme.textPrimary,
                                fontWeight: '600',
                                lineHeight: 24,
                                fontSize: 17,
                                marginRight: 2,
                            }}
                            numberOfLines={1}
                        >
                            {op.type === 'deposit' ? '+' : '-'}
                            <ValueComponent
                                value={op.amount}
                                precision={3}
                            />
                            {' TON'}
                        </Text>
                        <PriceComponent
                            amount={op.amount}
                            prefix={op.type === 'deposit' ? '+' : '-'}
                            style={{
                                height: undefined,
                                backgroundColor: theme.transparent,
                                alignSelf: 'flex-end',
                                paddingHorizontal: 0, paddingVertical: 0,
                            }}
                            theme={theme}
                            textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                        />
                    </View>
                </View>
            </View>
        </Pressable>
    )
});

export const StakingOperationsFragment = fragment(() => {
    const { pool } = useParams<{ pool: Address }>();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const nominatorInfo = useNominatorInfo(pool, selected!.address, 'allTime', isTestnet).data;

    const operations = useMemo(() => {
        const ops = [
            ...(nominatorInfo?.nominator?.deposits ?? []).map((d) => ({ ...d, type: 'deposit' })),
            ...(nominatorInfo?.nominator?.withdraws ?? []).map((d) => ({ ...d, type: 'withdraw' })),
        ];

        return ops.sort((a, b) => {
            const aTime = new Date(a.time);
            const bTime = new Date(b.time);
            return bTime.getTime() - aTime.getTime();
        }) as (NominatorOperation & { type: 'withdraw' | 'deposit' })[];
    }, [nominatorInfo]);

    const operationsSectioned = useMemo(() => {
        const data: { title: string, data: (NominatorOperation & { type: 'withdraw' | 'deposit' })[] }[] = [];
        if (operations && operations.length > 0) {
            let lastDate: string | undefined;
            let lastDateIndex = 0;
            operations.forEach((op, index) => {
                const dateKey = formatDate(new Date(op.time).getTime() / 1000);
                if (lastDate !== dateKey) {
                    lastDate = dateKey;
                    data.push({ title: dateKey, data: [] });
                    lastDateIndex = index;
                }
                data[data.length - 1].data.push(op);
            });

        }
        return data;
    }, [operations]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('products.staking.analytics.operations')}
                onClosePressed={() => navigation.goBack()}
            />
            <SectionList
                style={{ marginTop: 16, flexBasis: 0, flexGrow: 1 }}
                sections={operationsSectioned}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                getItemCount={(data) => data.items.length}
                keyExtractor={(item, index) => item.time + index}
                renderItem={({ item }) => (
                    <StakingOperationComponent
                        key={`card-tx-${item.time}-${item.type}-${item.trigger}`}
                        op={item}
                    />
                )}
                stickySectionHeadersEnabled={false}
                contentInset={{ bottom: safeArea.bottom === 0 ? 16 : safeArea.bottom + 16 }}
                onEndReachedThreshold={0.5}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={{ width: '100%', paddingVertical: 8 }}>
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '600',
                            lineHeight: 24, color: theme.textPrimary
                        }}>
                            {title}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
});