import React, { useEffect, useState } from "react"
import { View, Text, StyleProp, ViewStyle } from "react-native"
import { AppConfig } from "../../AppConfig"
import { t } from "../../i18n/t"
import { Theme } from "../../Theme"
import { Countdown } from "../Countdown"
import { StakingCycleProgress } from "./StakingCycleProgress"

export const StakingCycle = React.memo((
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
            backgroundColor: Theme.item,
            minHeight: 70,
            borderRadius: 14,
            marginHorizontal: 16,
            overflow: 'hidden',
        }, style]}>
            {locked && (
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
            {!locked && (
                <>
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
                                {t('products.staking.info.cooldownActive')}
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