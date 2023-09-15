import React, { useEffect, useState } from "react"
import { View, Text, StyleProp, ViewStyle, Alert, Pressable } from "react-native"
import { t } from "../../i18n/t"
import { Countdown } from "../Countdown"
import { StakingCycleProgress } from "./StakingCycleProgress"
import { useAppConfig } from "../../utils/AppConfigContext"

import IcInfo from '@assets/ic-info.svg'

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
    const { Theme } = useAppConfig();
    const [left, setLeft] = useState(Math.floor(stakeUntil - (Date.now() / 1000)));

    useEffect(() => {
        const timerId = setInterval(() => {
            setLeft(Math.floor((stakeUntil) - (Date.now() / 1000)));
        }, 1000);
        return () => {
            clearInterval(timerId);
        };
    }, [stakeUntil]);

    const infoAlert = (locked?: boolean) => {
        if (!locked) {
            Alert.alert(t('products.staking.info.cooldownAlert'));
            return;
        }
        Alert.alert(t('products.staking.info.lockedAlert'));
    }

    return (
        <View style={[{
            backgroundColor: Theme.surfaceSecondary,
            minHeight: 70,
            borderRadius: 20,
            padding: 20,
            overflow: 'hidden',
        }, style]}>
            {locked && (
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1, paddingRight: 20 }}>
                        <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
                            <Text style={{
                                color: Theme.textPrimary,
                                fontWeight: '600',
                                fontSize: 17, lineHeight: 24
                            }}>
                                {t('products.staking.nextCycle') + ' '}
                                <Countdown
                                    left={left}
                                    textStyle={{
                                        color: Theme.textPrimary,
                                        fontWeight: '600',
                                        fontSize: 17, lineHeight: 24
                                    }}
                                />
                            </Text>
                        </View>
                        <Pressable onPress={() => infoAlert(true)}>
                            <Text style={{
                                color: Theme.textSecondary,
                                fontWeight: '400',
                                fontSize: 15, lineHeight: 20,
                                marginTop: 2
                            }}>
                                {withdraw ? t('products.staking.cycleNoteWithdraw') : t('products.staking.cycleNote')}
                                <View style={{ height: 16, width: 16 + 6, alignItems: 'flex-end' }}>
                                    <IcInfo
                                        height={16} width={16}
                                        style={{ height: 16, width: 16, position: 'absolute', top: 2, right: 0, left: 6, bottom: 0 }}
                                    />
                                </View>
                            </Text>
                        </Pressable>
                    </View>
                    <StakingCycleProgress left={left} />
                </View>
            )}
            {!locked && (
                <View style={{ flex: 1 }}>
                    <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
                        <Text style={{
                            color: Theme.textPrimary,
                            fontWeight: '600',
                            fontSize: 16
                        }}>
                            {t('products.staking.info.cooldownTitle')}
                        </Text>
                        <Text style={{
                            color: Theme.accentGreen,
                            fontSize: 16,
                            fontVariant: ['tabular-nums']
                        }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {t('products.staking.info.cooldownActive')}
                        </Text>
                    </View>
                    <Pressable onPress={() => infoAlert()}>
                        <Text style={{
                            color: Theme.textSecondary,
                            fontWeight: '400',
                            fontSize: 13,
                            marginTop: 8
                        }}>
                            {t('products.staking.info.cooldownDescription')}
                            <View style={{ height: 16, width: 16 + 6, alignItems: 'flex-end' }}>
                                <IcInfo
                                    height={16} width={16}
                                    style={{ height: 16, width: 16, position: 'absolute', top: 2, right: 0, left: 6, bottom: 0 }}
                                />
                            </View>
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    )
})