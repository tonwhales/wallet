import { memo, useEffect, useState } from "react"
import { View, ViewStyle } from "react-native";
import Animated, { Easing, FadeInUp, FadeOutUp, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useAppConfig } from "../../utils/AppConfigContext";
import { StyleProp } from "react-native";

export const AnimatedChildrenCollapsible = memo(({
    collapsed,
    items,
    renderItem,
    itemHeight = 82,
    showDivider = true,
    dividerStyle,
    divider
}: {
    collapsed: boolean,
    items: any[],
    renderItem: (item: any, index: number) => any,
    itemHeight?: number,
    showDivider?: boolean,
    dividerStyle?: StyleProp<ViewStyle>,
    divider?: any
}) => {
    const { Theme } = useAppConfig();
    const [itemsToRender, setItemsToRender] = useState<any[]>([]);
    const sharedHeight = useSharedValue(collapsed ? 0 : items.length * itemHeight);
    const animStyle = useAnimatedStyle(() => {
        return { height: withTiming(sharedHeight.value, { duration: 250 }) };
    });

    useEffect(() => {
        setItemsToRender(collapsed ? [] : items);
        sharedHeight.value = collapsed ? 0 : items.length * itemHeight;
    }, [collapsed, items]);

    return (
        <Animated.View style={[
            { overflow: 'hidden' },
            animStyle
        ]}>
            {itemsToRender.map((item, index) => {
                return (
                    <Animated.View
                        key={`collapsible-item-${index}`}
                        entering={FadeInUp.delay(20 * index).easing(Easing.cubic).duration(100)}
                        exiting={FadeOutUp.delay(20 * (itemsToRender.length - index)).easing(Easing.cubic).duration(100)}
                        style={{ height: itemHeight }}
                    >
                        {index === 0 && showDivider && (
                            divider
                                ? divider
                                : <View
                                    style={[
                                        {
                                            backgroundColor: Theme.mediumGrey,
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