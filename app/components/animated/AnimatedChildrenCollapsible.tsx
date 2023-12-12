import React from "react";
import { ReactNode, memo, useEffect, useState } from "react"
import { View, ViewStyle } from "react-native";
import Animated, { Easing, FadeInUp, FadeOutUp, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { StyleProp } from "react-native";
import { useTheme } from "../../engine/hooks";

export const AnimatedChildrenCollapsible = memo(({
    collapsed,
    items,
    renderItem,
    itemHeight = 82,
    showDivider = true,
    dividerStyle,
    divider,
    additionalFirstItem,
    style
}: {
    collapsed: boolean,
    items: any[],
    renderItem: (item: any, index: number) => any,
    itemHeight?: number,
    showDivider?: boolean,
    dividerStyle?: StyleProp<ViewStyle>,
    divider?: any,
    additionalFirstItem?: ReactNode,
    style?: StyleProp<ViewStyle>
}) => {
    const theme = useTheme();
    const [itemsToRender, setItemsToRender] = useState<any[]>([]);
    const sharedHeight = useSharedValue(collapsed ? 0 : items.length * (itemHeight + (style as any)?.gap ?? 0));
    const animStyle = useAnimatedStyle(() => {
        return { height: withTiming(sharedHeight.value, { duration: 250 }) };
    });

    useEffect(() => {
        setItemsToRender(collapsed ? [] : items);
        sharedHeight.value = collapsed ? 0 : items.length * (itemHeight + (style as any)?.gap ?? 0);
    }, [collapsed, items]);

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
            {itemsToRender.map((item, index) => {
                return (
                    <Animated.View
                        key={`collapsible-item-${index}`}
                        entering={FadeInUp.delay(20 * index).easing(Easing.cubic).duration(100)}
                        exiting={FadeOutUp.delay(20 * (itemsToRender.length - index)).easing(Easing.cubic).duration(100)}
                        style={{ height: itemHeight }}
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
        </Animated.View>
    );
});