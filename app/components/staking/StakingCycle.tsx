import React, { memo, useEffect, useState } from "react"
import { View, Text, StyleProp, ViewStyle } from "react-native"
import { t } from "../../i18n/t"
import { Countdown } from "../Countdown"
import { StakingCycleProgress } from "./StakingCycleProgress"
import { useTheme } from "../../engine/hooks"
import { AboutIconButton } from "../AboutIconButton"
import { Typography } from "../styles"

export const StakingCycle = memo((
    {
        stakeUntil,
        style,
        withdraw,
        locked
    }: {
        stakeUntil: number,
        style?: StyleProp<ViewStyle>,
        withdraw?: boolean,
        locked: boolean
    }
) => {
    const theme = useTheme();
    const [left, setLeft] = useState(Math.floor(stakeUntil - (Date.now() / 1000)));

    useEffect(() => {
        const timerId = setInterval(() => {
            setLeft(Math.floor((stakeUntil) - (Date.now() / 1000)));
        }, 1000);
        return () => {
            clearInterval(timerId);
        };
    }, [stakeUntil]);
    return (
        <View style={[{
            backgroundColor: theme.surfaceOnBg,
            minHeight: 70,
            borderRadius: 20,
            padding: 20,
            overflow: 'hidden',
        }, style]}>
            {locked && (
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1, paddingRight: 20 }}>
                        <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                {t('products.staking.nextCycle') + ' '}
                                <Countdown
                                    left={left}
                                    textStyle={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                />
                            </Text>
                        </View>
                        <Text style={[{
                            color: theme.textSecondary,
                            marginTop: 2
                        }, Typography.regular15_20]}>
                            {withdraw ? t('products.staking.cycleNoteWithdraw') : t('products.staking.cycleNote')}
                            <View style={{ height: 16, width: 16 + 6, alignItems: 'flex-end' }}>
                                <AboutIconButton
                                    title={withdraw ? t('products.staking.cycleNoteWithdraw') : t('products.staking.cycleNote')}
                                    description={t('products.staking.info.lockedAlert')}
                                    style={{ height: 16, width: 16, position: 'absolute', top: 2, right: 0, left: 6, bottom: 0 }}
                                />
                            </View>
                        </Text>
                    </View>
                    <StakingCycleProgress left={left} />
                </View>
            )}
            {!locked && (
                <View style={{ flex: 1 }}>
                    <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                            {t('products.staking.info.cooldownTitle')}
                        </Text>
                        <Text style={[{
                            color: theme.accentGreen,
                            fontVariant: ['tabular-nums']
                        }, Typography.regular15_20]}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {t('products.staking.info.cooldownActive')}
                        </Text>
                    </View>
                    <Text style={[{
                        color: theme.textSecondary,
                        marginTop: 2
                    }, Typography.regular15_20]}>
                        {t('products.staking.info.cooldownDescription')}
                        <View style={{ height: 16, width: 16 + 6, alignItems: 'flex-end' }}>
                            <AboutIconButton
                                title={t('products.staking.info.cooldownDescription')}
                                description={t('products.staking.info.cooldownAlert')}
                                style={{ height: 16, width: 16, position: 'absolute', top: 2, right: 0, left: 6, bottom: 0 }}
                            />
                        </View>
                    </Text>
                </View>
            )}
        </View>
    )
})