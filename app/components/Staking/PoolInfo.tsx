import React from "react"
import { useTranslation } from "react-i18next";
import { View, Text } from "react-native"
import { StakingPoolState } from "../../storage/cache";
import { Theme } from "../../Theme";
import { ValueComponent } from "../ValueComponent";

export const PoolInfo = React.memo(({ pool }: { pool: StakingPoolState }) => {
    const { t } = useTranslation();

    return (
        <View>
            <View style={{
                flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'flex-end', width: '100%',
                flexWrap: 'wrap'
            }}>
                <Text style={{ color: Theme.textColor, fontSize: 16 }} ellipsizeMode="tail">
                    {t("products.staking.pool.balance")}
                </Text>
                <Text style={{
                    color: Theme.textColor, fontSize: 16,
                    fontWeight: '600'
                }}>
                    <ValueComponent
                        value={pool.balance}
                        centFontStyle={{ fontSize: 14, fontWeight: '500', opacity: 0.8 }}
                        centLength={3}
                    />
                </Text>
            </View>
            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16 }} />
            <View style={{
                flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'flex-end', width: '100%',
                flexWrap: 'wrap'
            }}>
                <Text style={{
                    textAlign: 'center',
                    color: Theme.textColor,
                    fontSize: 16
                }}>
                    {t('products.staking.pool.profitability')}
                </Text>
                <Text
                    style={{
                        color: Theme.textColor, fontSize: 16,
                        fontWeight: '600'
                    }}
                    ellipsizeMode="tail"
                >
                    {'13.3% (APY)'}
                </Text>
            </View>
            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16 }} />
            <View style={{
                flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'flex-end', width: '100%',
                flexWrap: 'wrap'
            }}>
                <Text style={{ color: Theme.textColor, fontSize: 16 }} ellipsizeMode="tail">
                    {t("products.staking.pool.members")}
                </Text>
                <Text
                    style={{
                        color: Theme.textColor, fontSize: 16,
                        fontWeight: '600'
                    }}
                    ellipsizeMode="tail"
                >
                    {pool.members.length}
                </Text>
            </View>
        </View>
    );
});