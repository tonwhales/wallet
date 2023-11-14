import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View, Text, Image } from "react-native";
import { JettonProductItem } from "./JettonProductItem";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { t } from "../../i18n/t";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { useMarkJettonDisabled } from "../../engine/hooks/jettons/useMarkJettonDisabled";
import { useAccountLite, useJettons, useSelectedAccount, useTheme } from "../../engine/hooks";

import IcTokens from '@assets/ic-jettons.svg';
import IcChevron from '@assets/ic_chevron_down.svg'
import IcHide from '@assets/ic-hide.svg';
import IcTonIcon from '@assets/ic_ton_account.svg';

export const JettonsProductComponent = memo(() => {
    const theme = useTheme();
    const markJettonDisabled = useMarkJettonDisabled();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const balance = useAccountLite(selected!.address)?.balance ?? 0n;

    const jettons = useJettons(selected!.addressString);
    const visibleList = jettons.filter((j) => !j.disabled);
    const [collapsed, setCollapsed] = useState(true);

    const rotation = useSharedValue(0);

    const animatedChevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, -180])}deg` }] }), []);

    const collapsedBorderStyle = useAnimatedStyle(() => {
        return {
            borderBottomEndRadius: withTiming((collapsed ? 20 : 0), { duration: 200 }),
            borderBottomStartRadius: withTiming((collapsed ? 20 : 0), { duration: 200 }),
        }
    });

    useEffect(() => {
        rotation.value = withTiming(collapsed ? 0 : 1, { duration: 150 });
    }, [collapsed])

    const visibleCount = useMemo(() => {
        return visibleList.length + 1; // Including main wallet TON balance
    }, [visibleList.length]);

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const onTonPress = useCallback(() => {
        navigation.navigate('SimpleTransfer');
    }, []);

    const tonItem = useMemo(() => {
        return (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ flex: 1, paddingHorizontal: 16 }}
                onPress={onTonPress}
            >
                <Animated.View style={[
                    {
                        flexDirection: 'row', flexGrow: 1,
                        alignItems: 'center',
                        padding: 20,
                        backgroundColor: theme.surfaceSecondary,
                        borderTopLeftRadius: visibleCount > 5 ? 0 : 20,
                        borderTopRightRadius: visibleCount > 5 ? 0 : 20,
                        borderBottomLeftRadius: visibleCount === 1 ? 20 : 0,
                        borderBottomRightRadius: visibleCount === 1 ? 20 : 0,
                        overflow: 'hidden'
                    },
                    animatedStyle
                ]}>
                    <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                        <IcTonIcon width={46} height={46} />
                        <Image
                            source={require('@assets/ic-verified.png')}
                            style={{
                                height: 16, width: 16,
                                position: 'absolute', right: -2, bottom: -2,
                            }}
                        />
                    </View>
                    <View style={{ marginLeft: 12, flexShrink: 1 }}>
                        <Text
                            style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {'TON'}
                        </Text>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                        >
                            {'The Open Network'}
                        </Text>
                    </View>
                    <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                        <Text style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}>
                            <ValueComponent value={balance} precision={2} />{' TON'}
                        </Text>
                        <PriceComponent
                            amount={balance}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                height: undefined,
                            }}
                            textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                        />
                    </View>
                </Animated.View>
                {visibleCount > 1 && (<View style={{ backgroundColor: theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />)}
            </Pressable>
        )
    }, [theme, balance, onPressIn, onPressOut, animatedStyle, onTonPress, visibleCount]);

    if (visibleCount > 5) {
        return (
            <View>
                <Pressable
                    onPress={() => setCollapsed(!collapsed)}
                    style={{ marginHorizontal: 16 }}
                >
                    <Animated.View style={[
                        {
                            flexDirection: 'row',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            padding: 20,
                            backgroundColor: theme.surfaceSecondary,
                            borderTopEndRadius: 20,
                            borderTopStartRadius: 20
                        },
                        collapsedBorderStyle
                    ]}>
                        <View style={{
                            height: 46, width: 46,
                            borderRadius: 23,
                            marginRight: 12,
                            justifyContent: 'center', alignItems: 'center',
                            backgroundColor: theme.accent
                        }}>
                            <IcTokens
                                height={32} width={32}
                                style={{ height: 32, width: 32 }}
                                color={theme.white}
                            />
                            <View style={{
                                position: 'absolute',
                                bottom: -5, right: -2,
                                height: 16, borderRadius: 8,
                                backgroundColor: theme.accent,
                                justifyContent: 'center', alignItems: 'center',
                                borderWidth: 2, borderColor: theme.white,
                                paddingHorizontal: visibleCount > 9 ? 5 : 2.5
                            }}>
                                <Text style={{ fontSize: 10, fontWeight: '500', color: theme.white }}>
                                    {visibleCount}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 17,
                                lineHeight: 24,
                                color: theme.textPrimary,
                            }}>
                                {t('common.assets')}
                            </Text>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 15,
                                lineHeight: 20,
                                color: theme.textSecondary
                            }}
                                numberOfLines={1}
                            >
                                {'TON, ' + visibleList.map((j, index) => j.name).join(', ')}
                            </Text>
                        </View>
                        <Animated.View style={[
                            {
                                height: 32, width: 32,
                                borderRadius: 16,
                                justifyContent: 'center', alignItems: 'center',
                                alignSelf: 'center',
                                backgroundColor: theme.divider
                            },
                            animatedChevron
                        ]}>
                            <IcChevron style={{ height: 12, width: 12 }} height={12} width={12} />
                        </Animated.View>
                    </Animated.View>
                </Pressable>
                <AnimatedChildrenCollapsible
                    collapsed={collapsed}
                    items={visibleList}
                    itemHeight={86}
                    divider={
                        <View style={{ backgroundColor: theme.surfaceSecondary, marginHorizontal: 16, paddingHorizontal: 20 }}>
                            <View style={{ backgroundColor: theme.divider, height: 1 }} />
                        </View>
                    }
                    additionalFirstItem={tonItem}
                    renderItem={(j, index) => {
                        return (
                            <JettonProductItem
                                key={'jt' + j.wallet.toString()}
                                jetton={j}
                                last={index === visibleList.length - 2}
                                rightAction={() => markJettonDisabled(j.master)}
                                rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                            />
                        )
                    }}
                />
            </View>
        );
    }

    return (
        <View>
            {tonItem}
            {visibleList.map((j, index) => {
                return (
                    <JettonProductItem
                        key={'jt' + j.wallet.toString()}
                        jetton={j}
                        last={index === visibleList.length - 1}
                        rightAction={() => markJettonDisabled(j.master)}
                        rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                        single={visibleList.length === 1}
                    />
                )
            })}
        </View>
    );
});