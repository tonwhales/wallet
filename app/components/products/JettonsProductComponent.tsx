import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View, Text } from "react-native";
import { useEngine } from "../../engine/Engine";
import { JettonProductItem } from "./JettonProductItem";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useAppConfig } from "../../utils/AppConfigContext";
import { t } from "../../i18n/t";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { markJettonDisabled } from "../../engine/sync/ops";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import BN from "bn.js";

import IcTokens from '@assets/ic-jettons.svg';
import IcChevron from '@assets/ic_chevron_down.svg'
import IcHide from '@assets/ic-hide.svg';
import IcTonIcon from '@assets/ic_ton_account.svg';

export const JettonsProductComponent = memo(() => {
    const engine = useEngine();
    const { Theme } = useAppConfig();
    const navigaiton = useTypedNavigation();
    const balance = engine.products.main.useAccount()?.balance ?? new BN(0);

    const visibleList = engine.products.main.useJettons().filter((j) => !j.disabled);
    const [collapsed, setCollapsed] = useState(true);

    const rotation = useSharedValue(0);

    const animatedChevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, -180])}deg` }] }), []);

    const collapsedBorderStyle = useAnimatedStyle(() => {
        return {
            borderBottomEndRadius: withTiming((collapsed ? 20 : 0), { duration: 250 }),
            borderBottomStartRadius: withTiming((collapsed ? 20 : 0), { duration: 250 }),
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
        navigaiton.navigate('SimpleTransfer');
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
                        backgroundColor: Theme.surfaceSecondary,
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
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text
                            style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {'TON'}
                        </Text>
                        <Text
                            numberOfLines={1} ellipsizeMode={'tail'}
                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: Theme.textSecondary }}
                        >
                            <Text style={{ flexShrink: 1, flexGrow: 1 }}>
                                {'The Open Network'}
                            </Text>
                        </Text>
                    </View>
                    <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                        <Text style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}>
                            <ValueComponent value={balance} precision={2} />{' TON'}
                        </Text>
                        <PriceComponent
                            amount={balance}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                height: undefined
                            }}
                            textStyle={{ color: Theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                        />
                    </View>
                </Animated.View>
                <View style={{ backgroundColor: Theme.divider, height: 1, position: 'absolute', bottom: 0, left: 36, right: 36 }} />
            </Pressable>
        )
    }, [Theme, balance, onPressIn, onPressOut, animatedStyle, onTonPress, visibleCount]);

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
                            backgroundColor: Theme.surfaceSecondary,
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
                            backgroundColor: Theme.accent
                        }}>
                            <IcTokens
                                height={32} width={32}
                                style={{ height: 32, width: 32 }}
                                color={Theme.white}
                            />
                            <View style={{
                                position: 'absolute',
                                bottom: -5, right: -2,
                                height: 16, borderRadius: 8,
                                backgroundColor: Theme.accent,
                                justifyContent: 'center', alignItems: 'center',
                                borderWidth: 2, borderColor: Theme.white,
                                paddingHorizontal: visibleCount > 9 ? 5 : 2.5
                            }}>
                                <Text style={{ fontSize: 10, fontWeight: '500', color: Theme.white }}>
                                    {visibleCount}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 17,
                                lineHeight: 24,
                                color: Theme.textPrimary,
                            }}>
                                {t('common.assets')}
                            </Text>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 15,
                                lineHeight: 20,
                                color: Theme.textSecondary
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
                                backgroundColor: Theme.divider
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
                        <View style={{ backgroundColor: Theme.surfaceSecondary, marginHorizontal: 16, paddingHorizontal: 20 }}>
                            <View style={{ backgroundColor: Theme.divider, height: 1 }} />
                        </View>
                    }
                    additionalFirstItem={tonItem}
                    renderItem={(j, index) => {
                        return (
                            <JettonProductItem
                                key={'jt' + j.wallet.toFriendly()}
                                jetton={j}
                                last={index === visibleCount - 1}
                                rightAction={() => markJettonDisabled(engine, j.master)}
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
                        key={'jt' + j.wallet.toFriendly()}
                        jetton={j}
                        last={index === visibleList.length - 1}
                        rightAction={() => markJettonDisabled(engine, j.master)}
                        rightActionIcon={<IcHide height={36} width={36} style={{ width: 36, height: 36 }} />}
                        single={visibleList.length === 1}
                    />
                )
            })}
        </View>
    );
});