import React from "react";
import { ReactNode, memo, useEffect } from "react"
import { Pressable, View, ViewStyle, Text } from "react-native";
import Animated, { Easing, Extrapolation, FadeInUp, FadeOutUp, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { StyleProp } from "react-native";
import { useTheme } from "../../engine/hooks";
import { CollapsibleCardsLimitConfig } from "./CollapsibleCards";
import { t } from "../../i18n/t";
import { Typography } from "../styles";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ASSET_ITEM_HEIGHT } from "../../utils/constants";

type Item<T> = T & { height?: number };

type AnimatedChildrenCollapsibleProps<T> = {
    collapsed: boolean,
    items: Item<T>[],
    renderItem: (item: Item<T>, index: number) => any,
    itemHeight?: number,
    showDivider?: boolean,
    dividerStyle?: StyleProp<ViewStyle>,
    divider?: any,
    additionalFirstItem?: ReactNode,
    style?: StyleProp<ViewStyle>,
    limitConfig?: CollapsibleCardsLimitConfig,
};

const AnimatedChildrenCollapsibleComponent = <T,>({
    collapsed,
    items,
    renderItem,
    itemHeight = ASSET_ITEM_HEIGHT,
    showDivider = true,
    dividerStyle,
    divider,
    additionalFirstItem,
    style,
    limitConfig
}: AnimatedChildrenCollapsibleProps<T>) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const itemsLen = limitConfig?.maxItems ?? items.length;
    const itemsHeight = (items.slice(0, itemsLen)).map((item) => item.height || itemHeight).reduce((a, b) => a + b, 0);
    const gap = (style as any)?.gap || 0;
    const height = itemsHeight + ((itemsLen - 1) * gap) + 20 + 32;
    const sharedHeight = useSharedValue(collapsed ? 0 : height);
    const animStyle = useAnimatedStyle(() => {
        return { height: withTiming(sharedHeight.value, { duration: 250 }) };
    });

    useEffect(() => {
        sharedHeight.value = collapsed ? 0 : height;
    }, [collapsed, height]);

    const progress = useSharedValue(collapsed ? 0 : 1);

    useEffect(() => {
        progress.value = withTiming(collapsed ? 0 : 1, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        });
    }, [collapsed]);

    const titleStyle = useAnimatedStyle(() => ({
        height: interpolate(
            progress.value,
            [0, 1],
            [0, 48],
            Extrapolation.CLAMP
        ),
        opacity: interpolate(
            progress.value,
            [0, 1],
            [0, 1],
            Extrapolation.CLAMP
        )
    }));

    return (
        <Animated.View style={[{ overflow: 'hidden' }, animStyle, style]}>
            {!!additionalFirstItem && (
                <Animated.View
                    key={`collapsible-item-first`}
                    entering={FadeInUp.delay(10).easing(Easing.cubic).duration(100)}
                    exiting={FadeOutUp.delay(20).easing(Easing.cubic).duration(100)}
                    style={{ height: itemHeight }}
                >
                    {showDivider && (
                        divider
                            ? divider
                            : <View
                                style={[
                                    {
                                        backgroundColor: theme.divider,
                                        height: 1,
                                        marginHorizontal: 20
                                    },
                                    dividerStyle
                                ]}
                            />
                    )}
                    {additionalFirstItem}
                </Animated.View>
            )}
            {items.slice(0, limitConfig?.maxItems).map((item, index) => {
                return (
                    <Animated.View
                        key={`collapsible-item-${index}`}
                        entering={FadeInUp.delay(20 * index).easing(Easing.cubic).duration(100)}
                        exiting={FadeOutUp.delay(20 * (items.length - index)).easing(Easing.cubic).duration(100)}
                        style={{ height: item.height || itemHeight }}
                    >
                        {index === 0 && showDivider && !additionalFirstItem && (
                            divider
                                ? divider
                                : <View
                                    style={[
                                        {
                                            backgroundColor: theme.divider,
                                            height: 1,
                                            marginHorizontal: 20
                                        },
                                        dividerStyle
                                    ]}
                                />
                        )}
                        {renderItem(item, index)}
                    </Animated.View>
                );
            })}
            {!!limitConfig && (items.length > limitConfig.maxItems) && (
                <Animated.View
                    style={[
                        {
                            width: '100%',
                            flexDirection: 'row',
                            justifyContent: 'center', alignItems: 'center',
                            paddingHorizontal: 16
                        },
                        titleStyle
                    ]}
                >
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1
                            }
                        }}
                        onPress={() => navigation.navigateProductsList(limitConfig.fullList)}
                    >
                        <Text style={[{ color: theme.accent }, Typography.medium15_20]}>
                            {t('common.showMore')}
                        </Text>
                    </Pressable>
                </Animated.View>
            )}
        </Animated.View>
    );
};

export const AnimatedChildrenCollapsible = memo(AnimatedChildrenCollapsibleComponent) as typeof AnimatedChildrenCollapsibleComponent;