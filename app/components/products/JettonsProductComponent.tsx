import React, { useEffect, useState } from "react";
import { Pressable, View, Text } from "react-native";
import { useEngine } from "../../engine/Engine";
import { JettonProductItem } from "./JettonProductItem";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useAppConfig } from "../../utils/AppConfigContext";
import { t } from "../../i18n/t";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { markJettonDisabled } from "../../engine/sync/ops";

import Tokens from '../../../assets/ic-jettons.svg';
import Chevron from '../../../assets/ic_chevron_down.svg'
import Hide from '../../../assets/ic-hide.svg';

export const JettonsProductComponent = React.memo(() => {
    const engine = useEngine();
    const { Theme } = useAppConfig();

    const visibleList = engine.products.main.useJettons().filter((j) => !j.disabled);
    const [collapsed, setCollapsed] = useState(true);

    const rotation = useSharedValue(0);

    const animatedChevron = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, -180])}deg` }],
        }
    }, []);

    const collapsedBorderStyle = useAnimatedStyle(() => {
        return {
            borderBottomEndRadius: withTiming((collapsed ? 20 : 0), { duration: 250 }),
            borderBottomStartRadius: withTiming((collapsed ? 20 : 0), { duration: 250 }),
        }
    });

    useEffect(() => {
        rotation.value = withTiming(collapsed ? 0 : 1, { duration: 150 });
    }, [collapsed])

    if (visibleList.length === 0) {
        return null;
    }

    if (visibleList.length > 5) {
        return (
            <View>
                <Pressable
                    onPress={() => {
                        setCollapsed(!collapsed)
                    }}
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
                            <Tokens
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
                                paddingHorizontal: visibleList.length > 9 ? 5 : 2.5
                            }}>
                                <Text style={{ fontSize: 10, fontWeight: '500', color: Theme.white }}>
                                    {visibleList.length}
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
                                {t('jetton.productButtonTitle', { count: visibleList.length })}
                            </Text>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 15,
                                lineHeight: 20,
                                color: Theme.textSecondary
                            }}
                                numberOfLines={1}
                            >
                                {visibleList.map((j, index) => j.name).join(', ')}
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
                            <Chevron style={{ height: 12, width: 12 }} height={12} width={12} />
                        </Animated.View>
                    </Animated.View>
                </Pressable>
                <AnimatedChildrenCollapsible
                    collapsed={collapsed}
                    items={visibleList}
                    itemHeight={86}
                    divider={
                        <View style={{ backgroundColor: Theme.surfaceSecondary, marginHorizontal: 16, paddingHorizontal: 20 }}>
                            <View style={{ backgroundColor: Theme.style === 'dark' ? Theme.surfacePimary : Theme.divider, height: 1 }} />
                        </View>
                    }
                    renderItem={(j, index) => {
                        return (
                            <JettonProductItem
                                key={'jt' + j.wallet.toFriendly()}
                                jetton={j}
                                last={index === visibleList.length - 1}
                                rightAction={() => markJettonDisabled(engine, j.master)}
                                rightActionIcon={<Hide height={36} width={36} style={{ width: 36, height: 36 }} />}
                                single={visibleList.length === 1}
                            />
                        )
                    }}
                />
            </View>
        )
    }

    return (
        <View>
            {visibleList.map((j, index) => {
                return (
                    <JettonProductItem
                        key={'jt' + j.wallet.toFriendly()}
                        jetton={j}
                        first={index === 0}
                        last={index === visibleList.length - 1}
                        rightAction={() => markJettonDisabled(engine, j.master)}
                        rightActionIcon={<Hide height={36} width={36} style={{ width: 36, height: 36 }} />}
                        single={visibleList.length === 1}
                    />
                )
            })}
        </View>
    );
});