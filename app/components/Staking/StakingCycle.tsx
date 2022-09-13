import { formatDuration } from "date-fns"
import React, { useEffect, useMemo, useState } from "react"
import { View, Text, StyleProp, ViewStyle } from "react-native"
import { AppConfig } from "../../AppConfig"
import { t } from "../../i18n/t"
import { Theme } from "../../Theme"
import { Countdown, getDuration, shortLocale } from "../Countdown"
import { stakingCycle, StakingCycleProgress } from "./StakingCycleProgress"

const cooldownPeriod = AppConfig.isTestnet ? 30 * 60 : 2 * 60 * 60;

export const StakingCycle = React.memo((
    {
        stakeUntil,
        style,
        withdraw
    }: {
        stakeUntil: number,
        style?: StyleProp<ViewStyle>,
        withdraw?: boolean
    }
) => {
    const [left, setLeft] = useState(Math.floor(stakeUntil - (Date.now() / 1000)));

    const cooldownActive = useMemo(() => left > stakingCycle - cooldownPeriod, [left]);
    const cooldownDuration = useMemo(() => {
        const duration = left - (stakingCycle - cooldownPeriod);
        if (duration <= 0) {
            return '';
        }
        return formatDuration(getDuration(duration), { locale: shortLocale(t('lang') as 'ru' | 'en'), delimiter: ':', zero: true });
    }, [left, cooldownActive]);

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
            backgroundColor: Theme.item,
            minHeight: 70,
            borderRadius: 14,
            marginHorizontal: 16,
            overflow: 'hidden',
        }, style]}>
            {!cooldownActive && (
                <>
                    <StakingCycleProgress left={left} />
                    <View style={{
                        flex: 1,
                        paddingHorizontal: 16,
                        paddingTop: 15,
                        paddingBottom: 8
                    }}>
                        <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
                            <Text style={{
                                color: Theme.textColor,
                                fontWeight: '600',
                                fontSize: 16
                            }}>
                                {t('products.staking.nextCycle')}
                            </Text>
                            <Countdown
                                left={left}
                                textStyle={{
                                    fontWeight: '400',
                                    color: Theme.textColor,
                                    fontSize: 16
                                }}
                            />
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
                </>
            )}
            {cooldownActive && (
                <>
                    <StakingCycleProgress
                        left={left - (stakingCycle - cooldownPeriod)}
                        full={cooldownPeriod}
                    />
                    <View style={{
                        flex: 1,
                        paddingHorizontal: 16,
                        paddingTop: 15,
                        paddingBottom: 8
                    }}>
                        <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
                            <Text style={{
                                color: Theme.textColor,
                                fontWeight: '600',
                                fontSize: 16
                            }}>
                                {t('products.staking.info.cooldownTitle')}
                            </Text>
                            <Text style={{
                                color: Theme.success,
                                fontSize: 16,
                                fontVariant: ['tabular-nums']
                            }}
                                ellipsizeMode="tail"
                                numberOfLines={1}
                            >
                                {t('products.staking.info.cooldownActive', { duration: cooldownDuration })}
                            </Text>
                        </View>
                        <Text style={{
                            color: Theme.textSecondary,
                            fontWeight: '400',
                            fontSize: 13,
                            marginTop: 8
                        }}>
                            {t('products.staking.info.cooldownDescription')}
                        </Text>
                    </View>
                </>
            )}
        </View>
    )
})