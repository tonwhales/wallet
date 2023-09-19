import { View, Text, Pressable } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { Address, fromNano } from "ton";
import { useEngine } from "../../engine/Engine";
import { memo, useMemo } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { NominatorOperation } from "../../engine/api/fetchStakingNominator";
import { useAppConfig } from "../../utils/AppConfigContext";
import { PriceComponent } from "../../components/PriceComponent";
import { ValueComponent } from "../../components/ValueComponent";

export const StakingOperationComponent = memo(({ op }: { op: NominatorOperation & { type: 'withdraw' | 'deposit' } }) => {
    const { Theme } = useAppConfig();
    return (
        <Pressable
            style={{
                paddingHorizontal: 16,
                paddingVertical: 20
            }}
        >
            <View style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                {/* <HoldersNotificationIcon notification={notification} /> */}
                <View style={{ flex: 1, marginRight: 4 }}>
                    <Text
                        style={{ color: Theme.textPrimary, fontSize: 17, fontWeight: '600', lineHeight: 24, flexShrink: 1 }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {op.type === 'deposit' ? t('products.staking.actions.top_up') : t('products.staking.actions.withdraw')}
                    </Text>
                    <Text
                        style={{ color: Theme.textSecondary, fontSize: 15, marginRight: 8, lineHeight: 20, fontWeight: '400', marginTop: 2 }}
                        ellipsizeMode="middle"
                        numberOfLines={1}
                    >
                        {''}
                    </Text>
                </View>
                <View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text
                            style={{
                                color: op.type === 'deposit'
                                    ? Theme.accentGreen
                                    : Theme.textPrimary,
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
                                backgroundColor: Theme.transparent,
                                alignSelf: 'flex-end',
                                paddingHorizontal: 0, paddingVertical: 0,
                            }}
                            textStyle={{ color: Theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                        />
                    </View>
                </View>
            </View>
        </Pressable>
    )
});

export const StakingOperationsFragment = fragment(() => {
    const { pool } = useParams<{ pool: Address }>();
    const engine = useEngine();
    const nominatorInfo = engine.products.whalesStakingPools.useNominatorInfo(pool, engine.address);

    const operations = useMemo(() => {
        const ops = [
            ...(nominatorInfo?.nominator?.deposits ?? []).map((d) => ({ ...d, type: 'deposit' })),
            ...(nominatorInfo?.nominator?.withdraws ?? []).map((d) => ({ ...d, type: 'withdraw' })),
        ];

        return ops.sort((a, b) => {
            const aTime = new Date(a.time);
            const bTime = new Date(b.time);
            return aTime.getTime() - bTime.getTime();
        }) as (NominatorOperation & { type: 'withdraw' | 'deposit' })[];
    }, [nominatorInfo]);

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader title={t('common.operations')} />
            <ScrollView style={{ flexGrow: 1 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {operations.map((op, index) => {
                    return (<StakingOperationComponent key={`op-${index}`} op={op} />);
                })}
            </ScrollView>
        </View>
    );
});