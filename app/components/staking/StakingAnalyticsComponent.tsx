import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { t } from "../../i18n/t";
import { PriceComponent } from "../PriceComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Address } from "@ton/core";
import { useNetwork, useNominatorInfo, useSelectedAccount, useTheme } from "../../engine/hooks";

import IcGrowth from "@assets/ic-growth.svg";

export const StakingAnalyticsComponent = memo(({ pool }: { pool: Address }) => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const nominatorInfo = useNominatorInfo(pool, selected!.address, 'allTime', network.isTestnet).data;

    if (!nominatorInfo || network.isTestnet) {
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
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 20,
                    padding: 20, marginRight: 16,
                    minHeight: 126
                }}>
                    <Text style={{
                        color: theme.textPrimary,
                        fontWeight: '600',
                        fontSize: 17, lineHeight: 24
                    }}>
                        {t('products.staking.analytics.operations')}
                    </Text>
                    <Text style={{
                        color: theme.textSecondary,
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
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 20,
                    padding: 20,
                    minHeight: 126,
                }}>
                    <Text style={{
                        color: theme.textPrimary,
                        fontWeight: '600',
                        fontSize: 17, lineHeight: 24
                    }}>
                        {t('products.staking.analytics.analyticsTitle')}
                    </Text>
                    <Text style={{
                        color: theme.textSecondary,
                        fontWeight: '600',
                        fontSize: 15, lineHeight: 20, marginTop: 2
                    }}>
                        {t('products.staking.analytics.analyticsSubtitle')}
                    </Text>
                    <View style={{ flexGrow: 1 }} />
                    <View style={{
                        backgroundColor: theme.divider,
                        paddingHorizontal: 6, paddingVertical: 4,
                        alignSelf: 'flex-start', flexDirection: 'row',
                        borderRadius: 20, alignItems: 'center',
                        flexShrink: 1,
                        marginTop: 16,
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
                            amount={nominatorInfo.nominator?.profitAmount || 0n}
                            theme={theme}
                        />
                    </View>
                </View>
            </Pressable>
        </View>
    );
});