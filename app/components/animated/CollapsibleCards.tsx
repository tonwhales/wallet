import { ReactNode, memo, useEffect, useState } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { t } from "../../i18n/t";
import Animated, { Easing, Extrapolation, SharedValue, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Typography } from "../styles";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ProductsListFragmentParams } from "../../fragments/wallet/ProductsListFragment";
import { Image } from "expo-image";

export const CardItemWrapper = memo(({
    progress,
    item,
    index,
    itemHeight = 86,
}: {
    progress: SharedValue<number>,
    item: ReactNode,
    index: number,
    itemHeight?: number,
}) => {
    const animatedStyle = useAnimatedStyle(() => ({
        marginTop: interpolate(
            progress.value,
            [0, 1],
            [-16 - itemHeight * (index + 2), 16],
            Extrapolation.CLAMP
        ),
        height: interpolate(
            progress.value,
            [0, 1],
            [86, itemHeight],
            Extrapolation.CLAMP
        ),
    }));

    return (
        <Animated.View style={[
            { zIndex: 98 - index, marginTop: 16 },
            animatedStyle,
        ]}>
            {item}
        </Animated.View>
    )
});

export type CollapsibleCardsLimitConfig = {
    maxItems: number,
    fullList: ProductsListFragmentParams,
}

type CollapsibleCardsProps<T> = {
    title: string,
    items: (T & { height?: number })[],
    renderItem: (item: (T & { height?: number }), index: number) => any,
    renderFace?: () => any,
    itemHeight?: number,
    theme: ThemeType,
    initialCollapsed?: boolean,
    limitConfig?: CollapsibleCardsLimitConfig,
    action?: React.ReactNode
};

const CollapsibleCardsComponent = <T,>({
    title,
    items,
    renderItem,
    renderFace,
    itemHeight = 86,
    theme,
    initialCollapsed = true,
    limitConfig,
    action
}: CollapsibleCardsProps<T>) => {
    const navigation = useTypedNavigation();
    const dimentions = useWindowDimensions();
    const [collapsed, setCollapsed] = useState(initialCollapsed);

    const toggle = () => setCollapsed((prev) => !prev);

    const progress = useSharedValue(initialCollapsed ? 0 : 1);

    useEffect(() => {
        progress.value = withTiming(collapsed ? 0 : 1, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        });
    }, [collapsed]);

    const firstItem = items[0];
    const secondItem = items[1];
    const thirdItem = items[2];

    const firstHeight = firstItem?.height || itemHeight;
    const secondHeight = secondItem?.height || itemHeight;
    const thirdHeight = thirdItem?.height || itemHeight;

    const cardFirstItem = renderItem(firstItem, 0);
    const cardSecondItem = renderItem(secondItem, 1);
    const cardThirdItem = renderItem(thirdItem, 2);

    const cardLevelOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            progress.value,
            [0, 1],
            [1, 0],
            Extrapolation.CLAMP
        ),
        pointerEvents: progress.value === 1 ? 'none' : 'auto'
    }));

    const cardFirstLevelStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            progress.value,
            [1, 0],
            [1, 0],
            Extrapolation.CLAMP,
        ),
        height: interpolate(
            progress.value,
            [0, 1],
            [86, firstHeight],
            Extrapolation.CLAMP
        ),
        pointerEvents: progress.value === 0 ? 'none' : 'auto'
    }));

    const cardSecondLevelStyle = useAnimatedStyle(() => ({
        height: interpolate(
            progress.value,
            [0, 1],
            [76, secondHeight],
            Extrapolation.CLAMP
        ),
        width: interpolate(
            progress.value,
            [0, 1],
            [dimentions.width - 32 - 20, dimentions.width - 32],
            Extrapolation.CLAMP
        ),
        marginTop: interpolate(
            progress.value,
            [0, 1],
            [-66, 16 + firstHeight - 86],
            Extrapolation.CLAMP
        ),
    }));

    const cardThirdLevelStyle = useAnimatedStyle(() => ({
        height: interpolate(
            progress.value,
            [0, 1],
            [66, thirdHeight],
            Extrapolation.CLAMP
        ),
        width: interpolate(
            progress.value,
            [0, 1],
            [dimentions.width - 32 - 40, dimentions.width - 32],
            Extrapolation.CLAMP
        ),
        marginTop: interpolate(
            progress.value,
            [0, 1],
            [-58, 16],
            Extrapolation.CLAMP
        )
    }));

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
        ),
    }));

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 90])}deg` }]
    }));

    const mapHideWidth = (value: number) => {
        'worklet';

        if (value > 0.9) {
            return 'auto';
        }

        return value
    }

    const hideStyle = useAnimatedStyle(() => {
        let w: number | 'auto' = interpolate(
            progress.value,
            [0, 0.9, 1],
            [0, 0.9, 1],
            Extrapolation.CLAMP
        );

        return { width: mapHideWidth(w) }
    });

    const faceStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            progress.value,
            [0, 1],
            [1, 0],
            Extrapolation.CLAMP
        ),
        pointerEvents: progress.value === 1 ? 'none' : 'auto'
    }));

    if (items.length < 3) {
        return (
            <View>
                <View style={{ marginBottom: 14 }}>
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.8 : 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 16
                            }
                        }}
                        onPress={toggle}
                    >
                        <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                            {title}
                        </Text>
                        {action}
                    </Pressable>
                </View>
                <View style={{ gap: 16, paddingHorizontal: 16 }}>
                    {items.map((item, index) => {
                        const itemView = renderItem(item, index);
                        return itemView;
                    })}
                </View>
            </View>
        );
    }

    return (
        <View>
            <View>
                <Pressable
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.8 : 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            gap: 8,
                            justifyContent: 'space-between',
                            marginBottom: 8,
                            height: 34
                        }
                    }}
                    onPress={toggle}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                            {title}
                        </Text>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: theme.surfaceOnBg,
                            paddingVertical: 8, paddingHorizontal: 6,
                            borderRadius: 100,
                            gap: 4
                        }}>
                            <Animated.View style={chevronStyle}>
                                <Image
                                    source={require('@assets/ic-chevron-right.png')}
                                    style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                                />
                            </Animated.View>
                            <Animated.View style={hideStyle}>
                                <Text style={[{ color: theme.textSecondary, marginRight: 6 }, Typography.medium13_18]}>
                                    {t('common.hide')}
                                </Text>
                            </Animated.View>
                        </View>
                    </View>
                    {action}
                </Pressable>
            </View>
            <View style={{ zIndex: 102 }}>
                <View style={{ zIndex: 101 }}>
                    <Animated.View style={[
                        faceStyle,
                        { borderRadius: 20, overflow: 'hidden' }
                    ]}>
                        <Pressable onPress={() => setCollapsed(!collapsed)}>
                            {renderFace && renderFace()}
                        </Pressable>
                    </Animated.View>
                    <Animated.View style={[
                        { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
                        { paddingHorizontal: 16, borderRadius: 20 },
                        cardFirstLevelStyle
                    ]}>
                        {cardFirstItem}
                    </Animated.View>
                </View>
                <Animated.View
                    style={[
                        {
                            height: itemHeight,
                            marginHorizontal: 16,
                            overflow: 'hidden',
                            alignSelf: 'center',
                            borderRadius: 20,
                            zIndex: 100
                        },
                        cardSecondLevelStyle,
                        theme.style === 'dark' ? {
                            backgroundColor: theme.cardStackSecond,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 4,
                        } : {}
                    ]}
                >
                    {cardSecondItem}
                    <Animated.View
                        style={[
                            {
                                backgroundColor: theme.cardStackSecond,
                                position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                                borderRadius: 20
                            },
                            cardLevelOpacity
                        ]}
                    />
                </Animated.View>
                <Animated.View
                    style={[
                        {
                            height: itemHeight,
                            marginHorizontal: 16,
                            overflow: 'hidden',
                            alignSelf: 'center',
                            borderRadius: 20,
                            zIndex: 100 - 1
                        },
                        cardThirdLevelStyle
                    ]}
                >
                    {cardThirdItem}
                    <Animated.View
                        style={[
                            {
                                backgroundColor: theme.cardStackThird,
                                position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                            },
                            cardLevelOpacity
                        ]}
                    />
                </Animated.View>
            </View>
            <Animated.View style={{ paddingHorizontal: 16, overflow: 'hidden' }}>
                {items.slice(3, limitConfig?.maxItems).map((item, index) => {
                    const itemView = renderItem(item, index);
                    const height = item.height || itemHeight;
                    return (
                        <CardItemWrapper
                            key={`card-${index}`}
                            progress={progress}
                            item={itemView}
                            index={index}
                            itemHeight={height}
                        />
                    )
                })}
            </Animated.View>
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
        </View>
    )
};

export const CollapsibleCards = memo(CollapsibleCardsComponent) as typeof CollapsibleCardsComponent;