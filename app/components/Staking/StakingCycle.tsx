import React from "react"
import { View, Text, StyleProp, ViewStyle } from "react-native"
import { t } from "../../i18n/t"
import { Theme } from "../../Theme"
import { Countdown } from "../Countdown"
import { StakingCycleProgress } from "./StakingCycleProgress"

export const StakingCycle = React.memo((
    {
        stakeUntil,
        style,
        withdraw
    }: {
        stakeUntil: number,
        style?: StyleProp<ViewStyle>,
        withdraw?: boolean
    }) => {
    return (
        <View style={[{
            backgroundColor: 'white',
            minHeight: 70,
            borderRadius: 14,
            paddingTop: 15,
            paddingBottom: 12,
            marginHorizontal: 16,
            overflow: 'hidden',
        }, style]}>
            <StakingCycleProgress
                stakeUntil={stakeUntil}
            />
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
                <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
                    <Text style={{
                        color: Theme.textColor,
                        fontWeight: '600',
                        fontSize: 16
                    }}>
                        {t('products.staking.nextCycle')}
                    </Text>
                    <Countdown until={stakeUntil} textStyle={{
                        fontWeight: '400',
                        color: Theme.textColor,
                        fontSize: 16
                    }} />
                </View>
                <Text style={{
                    color: Theme.textSecondary,
                    fontWeight: '400',
                    fontSize: 13,
                    marginTop: 8
                }}>
                    {withdraw ? t('products.staking.cycleNoteWithdraw') : t('products.staking.cycleNote')}
                </Text>
            </View>
        </View>
    )
})