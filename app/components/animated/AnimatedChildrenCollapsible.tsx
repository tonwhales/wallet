import { memo, useEffect, useState } from "react"
import { View } from "react-native";
import Animated, { FadeInDown, FadeInUp, FadeOutUp, measure, runOnUI, useAnimatedRef, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export const AnimatedChildrenCollapsible = memo(({
    collapsed,
    items,
    renderItem,
    itemHeight = 76,
}: {
    collapsed: boolean,
    items: any[],
    renderItem: (item: any, index: number) => any,
    itemHeight?: number,
}) => {
    const [itemsToRender, setItemsToRender] = useState<any[]>([]);
    const sharedHeight = useSharedValue(0);

    const animStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(sharedHeight.value)
        }
    });

    useEffect(() => {
        if (collapsed) {
            setItemsToRender([]);
            sharedHeight.value = 0;
        } else {
            let height = 0;
            for (let i = 0; i < items.length; i++) {
                height += itemHeight;
                sharedHeight.value = height;
            }
            setItemsToRender(items);
        }
    }, [collapsed]);

    return (
        <Animated.View style={[
            { overflow: 'hidden' },
            animStyle
        ]}>
            {itemsToRender.map((item, index) => {
                return (
                    <Animated.View
                        key={`collapsible-item-${index}`}
                        entering={FadeInUp}
                        exiting={FadeOutUp}
                        style={{ height: itemHeight }}
                    >
                        {index === 0 && (
                            <Animated.View
                                entering={FadeInDown}
                                exiting={FadeOutUp}
                                style={{ backgroundColor: '#E4E6EA', height: 1, marginHorizontal: 20 }}
                            />
                        )}
                        {renderItem(item, index)}
                    </Animated.View>
                );
            })}
        </Animated.View>
    );
});