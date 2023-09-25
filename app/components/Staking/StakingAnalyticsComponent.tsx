import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";
import { t } from "../../i18n/t";
import { Address } from "ton";
import { useEngine } from "../../engine/Engine";
import BN from "bn.js";
import { PriceComponent } from "../PriceComponent";

import IcGrowth from "@assets/ic-growth.svg";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const StakingAnalyticsComponent = memo(({ pool }: { pool: Address }) => {
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const nominatorInfo = engine.products.whalesStakingPools.useNominatorInfo(pool, engine.address);

    if (!nominatorInfo  || AppConfig.isTestnet) {
        return null;
    }

    return (
        <View style={{ flexDirection: 'row', marginBottom: 20, minHeight: 126 }}>
            <Pressable
                style={({ pressed }) => ({ opacity: pressed ? .5 : 1, flex: 1 })}
                onPress={() => navigation.navigate('StakingOperations', { pool })}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: Theme.surfaceSecondary,
                    borderRadius: 20,
                    padding: 20, marginRight: 16,
                    minHeight: 126
                }}>
                    <Text style={{
                        color: Theme.textPrimary,
                        fontWeight: '600',
                        fontSize: 17, lineHeight: 24
                    }}>
                        {t('products.staking.analytics.operations')}
                    </Text>
                    <Text style={{
                        color: Theme.textSecondary,
                        fontWeight: '600',
                        fontSize: 15, lineHeight: 20, marginTop: 2
                    }}>
                        {t('products.staking.analytics.operationsDescription')}
                    </Text>
                </View>
            </Pressable>
            <Pressable
                style={({ pressed }) => ({ opacity: pressed ? .5 : 1, flex: 1 })}
                onPress={() => navigation.navigate('StakingAnalytics', { pool })}
            >
                <View style={{
                    backgroundColor: Theme.surfaceSecondary,
                    borderRadius: 20,
                    padding: 20,
                    minHeight: 126,
                }}>
                    <Text style={{
                        color: Theme.textPrimary,
                        fontWeight: '600',
                        fontSize: 17, lineHeight: 24
                    }}>
                        {t('products.staking.analytics.analyticsTitle')}
                    </Text>
                    <Text style={{
                        color: Theme.textSecondary,
                        fontWeight: '600',
                        fontSize: 15, lineHeight: 20, marginTop: 2
                    }}>
                        {t('products.staking.analytics.analyticsSubtitle')}
                    </Text>
                    <View style={{ flexGrow: 1 }} />
                    <View style={{
                        backgroundColor: Theme.divider,
                        paddingHorizontal: 6, paddingVertical: 4,
                        alignSelf: 'flex-start', flexDirection: 'row',
                        borderRadius: 20, alignItems: 'center',
                        flexShrink: 1,
                        marginTop: 16,
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
                            amount={nominatorInfo.nominator?.profitAmount || new BN(0)}
                        />
                    </View>
                </View>
            </Pressable>
        </View >
    );
});