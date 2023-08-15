import React, { useEffect, useState } from "react";
import { Pressable, View, Text } from "react-native";
import { useEngine } from "../../engine/Engine";
import { JettonProductItem } from "./JettonProductItem";
import Animated, { FadeIn, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useAppConfig } from "../../utils/AppConfigContext";
import { t } from "../../i18n/t";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";

import Tokens from '../../../assets/ic-jettons.svg';
import Chevron from '../../../assets/ic_chevron_down.svg'

export const JettonsProductComponent = React.memo(() => {
    const engine = useEngine();
    const { Theme } = useAppConfig();
    const { animatedStyle, onPressIn, onPressOut } = useAnimatedPressedInOut();

    const jettons = engine.products.main.useJettons().filter((j) => !j.disabled);
    const [collapsed, setCollapsed] = useState(true);

    const rotation = useSharedValue(0);

    const animatedChevron = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, -180])}deg` }],
        }
    }, []);

    useEffect(() => {
        rotation.value = withTiming(collapsed ? 0 : 1, { duration: 150 });
    }, [collapsed])

    if (jettons.length === 0) {
        return null;
    }

    if (jettons.length <= 3) {
        return (
            <View style={{
                borderRadius: 20,
                backgroundColor: Theme.lightGrey,
            }}>
                {jettons.map((j, index) => {
                    return (
                        <JettonProductItem
                            key={'jt' + j.wallet.toFriendly()}
                            jetton={j}
                            engine={engine}
                            last={index === jettons.length - 1}
                        />
                    );
                })}
            </View>
        );
    }

    return (
        <View style={{
            borderRadius: 20,
            backgroundColor: Theme.lightGrey,
        }}>
            <Pressable
                onPress={() => {
                    setCollapsed(!collapsed)
                }}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
            >
                <Animated.View style={[
                    {
                        flexDirection: 'row',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: 20,
                    },
                    animatedStyle
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
                            paddingHorizontal: jettons.length > 9 ? 5 : 2.5
                        }}>
                            <Text style={{ fontSize: 10, fontWeight: '500', color: Theme.white }}>
                                {jettons.length}
                            </Text>
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            fontWeight: '600',
                            fontSize: 17,
                            lineHeight: 24,
                            color: Theme.textColor,
                        }}>
                            {t('jetton.productButtonTitle', { count: jettons.length })}
                        </Text>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 15,
                            lineHeight: 20,
                            color: Theme.darkGrey
                        }}
                            numberOfLines={1}
                        >
                            {jettons.map((j, index) => j.name).join(', ')}
                            {/* {t('jetton.productButtonSubtitle', { count: jettons.length - 1, jettonName: jettons[0].name })} */}
                        </Text>
                    </View>
                    <Animated.View style={[
                        {
                            height: 32, width: 32,
                            borderRadius: 16,
                            justifyContent: 'center', alignItems: 'center',
                            alignSelf: 'center',
                            backgroundColor: Theme.mediumGrey
                        },
                        animatedChevron
                    ]}>
                        <Chevron style={{ height: 12, width: 12 }} height={12} width={12} />
                    </Animated.View>
                </Animated.View>
            </Pressable>
            <AnimatedChildrenCollapsible
                collapsed={collapsed}
                items={jettons}
                renderItem={(j, index) => {
                    return (
                        <JettonProductItem
                            key={'jt' + j.wallet.toFriendly()}
                            jetton={j}
                            engine={engine}
                            last={index === jettons.length - 1}
                        />
                    )
                }}
            />
        </View>
    );
});