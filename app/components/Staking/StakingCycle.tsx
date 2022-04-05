import React from "react"
import { useTranslation } from "react-i18next"
import { View, Text, StyleProp, ViewStyle } from "react-native"
import { Theme } from "../../Theme"
import { Countdown } from "../Countdown"
import { StakingSycleProgress } from "./StakingSycleProgress"

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
    const { t } = useTranslation();

    return (
        <View style={[
            {
                backgroundColor: 'white',
                minHeight: 70,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingTop: 15,
                paddingBottom: 12,
                overflow: 'hidden'
            },
            style
        ]}>
            <StakingSycleProgress style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0
            }}
                stakeUntil={stakeUntil}
            />
            <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
                <Text style={{
                    color: Theme.textColor,
                    fontWeight: '600',
                    fontSize: 16
                }}>
                    {t('products.staking.nextCycle')}
                </Text>
                <Countdown strict until={stakeUntil} textStyle={{
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
    )
})