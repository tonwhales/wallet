import { Fragment, ReactNode, memo, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { t } from "../../i18n/t";
import Animated, { Easing, Extrapolation, SharedValue, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Typography } from "../styles";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ProductsListFragmentParams } from "../../fragments/wallet/ProductsListFragment";
import { Image } from "expo-image";
import { ASSET_ITEM_HEIGHT } from "../../utils/constants";

export const CardItemWrapper = memo(({
    progress,
    item,
    index,
    itemHeight = ASSET_ITEM_HEIGHT,
}: {
    progress: SharedValue<number>,
    item: ReactNode,
    index: number,
    itemHeight?: number
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
            [ASSET_ITEM_HEIGHT, itemHeight],
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
    alwaysExpanded?: boolean,
    subtitleSection?: ReactNode
};

// Estimated width of "Hide" text for animation
const HIDE_TEXT_WIDTH = 40;

const CollapsibleCardsComponent = <T,>({
    title,
    items,
    renderItem,
    renderFace,
    itemHeight = ASSET_ITEM_HEIGHT,
    theme,
    initialCollapsed = true,
    limitConfig,
    action,
    alwaysExpanded = false,
    subtitleSection
}: CollapsibleCardsProps<T>) => {
    const navigation = useTypedNavigation();
    const dimensions = useWindowDimensions();
    const [collapsed, setCollapsed] = useState(!alwaysExpanded && initialCollapsed);
    const [isAnimating, setIsAnimating] = useState(false);
    const progress = useSharedValue(alwaysExpanded || initialCollapsed ? 0 : 1);

    // Pre-calculate width values outside worklets to avoid JS-to-native bridge calls
    const screenWidth = dimensions.width;
    const fullWidth = screenWidth - 32;
    const secondLevelCollapsedWidth = screenWidth - 32 - 20;
    const thirdLevelCollapsedWidth = screenWidth - 32 - 40;

    const toggle = useCallback(() => setCollapsed((prev) => !prev), []);

    const onAnimationComplete = useCallback((finished?: boolean) => {
        'worklet';
        if (finished) {
            runOnJS(setIsAnimating)(false);
        }
    }, []);

    useEffect(() => {
        setIsAnimating(true);
        progress.value = withTiming(
            collapsed ? 0 : 1,
            {
                duration: 300,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1)
            },
            onAnimationComplete
        );
    }, [collapsed]);

    const firstItem = items[0];
    const secondItem = items[1];
    const thirdItem = items[2];

    const firstHeight = firstItem?.height || itemHeight;
    const secondHeight = secondItem?.height || itemHeight;
    const thirdHeight = thirdItem?.height || itemHeight;

    // Only render items that exist
    const cardFirstItem = firstItem ? renderItem(firstItem, 0) : null;
    const cardSecondItem = secondItem ? renderItem(secondItem, 1) : null;
    const cardThirdItem = thirdItem ? renderItem(thirdItem, 2) : null;

    // Memoize sliced items to avoid creating new array on every render
    const remainingItems = useMemo(
        () => items.slice(3, limitConfig?.maxItems),
        [items, limitConfig?.maxItems]
    );

    // Derive pointerEvents from animation state - prevents discrete jumps during animation
    const expandedPointerEvents = !collapsed && !isAnimating ? 'auto' : 'none';
    const collapsedPointerEvents = collapsed && !isAnimating ? 'auto' : 'none';

    const cardLevelOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            progress.value,
            [0, 1],
            [1, 0],
            Extrapolation.CLAMP
        ),
    }));

    const cardFirstLevelStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            progress.value,
            [0, 1],
            [0, 1],
            Extrapolation.CLAMP,
        ),
        height: interpolate(
            progress.value,
            [0, 1],
            [ASSET_ITEM_HEIGHT, firstHeight],
            Extrapolation.CLAMP
        ),
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
            [secondLevelCollapsedWidth, fullWidth],
            Extrapolation.CLAMP
        ),
        marginTop: interpolate(
            progress.value,
            [0, 1],
            [-66, 16 + firstHeight - ASSET_ITEM_HEIGHT],
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
            [thirdLevelCollapsedWidth, fullWidth],
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

    // Use numeric width instead of 'auto' to enable smooth interpolation
    const hideStyle = useAnimatedStyle(() => ({
        width: interpolate(
            progress.value,
            [0, 0.5, 1],
            [0, 0, HIDE_TEXT_WIDTH],
            Extrapolation.CLAMP
        ),
        opacity: interpolate(
            progress.value,
            [0, 0.7, 1],
            [0, 0, 1],
            Extrapolation.CLAMP
        ),
    }));

    const faceStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            progress.value,
            [0, 1],
            [1, 0],
            Extrapolation.CLAMP
        ),
    }));

    if (items.length < 3) {
        return (
            <View>
                <View style={{ marginBottom: 14 }}>
                    <Pressable
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.8 : 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16
                        })}
                        onPress={toggle}
                    >
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                            {title}
                        </Text>
                        {action}
                    </Pressable>
                </View>
                {subtitleSection}
                <View style={{ gap: 16, paddingHorizontal: 16 }}>
                    {items.map((item, index) => {
                        const itemView = renderItem(item, index);
                        return <Fragment key={index}>{itemView}</Fragment>;
                    })}
                </View>
            </View>
        );
    }

    return (
        <View>
            {subtitleSection}
            <View>
                <Pressable
                    style={({ pressed }) => ({
                        opacity: pressed ? 0.8 : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        gap: 8,
                        justifyContent: 'space-between',
                        marginBottom: 8,
                        height: 34
                    })}
                    onPress={toggle}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                            {title}
                        </Text>
                        {!alwaysExpanded && (<View style={{
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
                            <Animated.View style={[hideStyle, { overflow: 'hidden' }]}>
                                <Text style={[{ color: theme.textSecondary, marginRight: 6 }, Typography.medium13_18]}>
                                    {t('common.hide')}
                                </Text>
                            </Animated.View>
                        </View>
                        )}
                    </View>
                    {action}
                </Pressable>
            </View>
            <View style={{ zIndex: 102 }}>
                <View style={{ zIndex: 101 }}>
                    <Animated.View
                        style={[
                            faceStyle,
                            { borderRadius: 20, overflow: 'hidden' }
                        ]}
                        pointerEvents={collapsedPointerEvents}
                    >
                        <Pressable onPress={toggle}>
                            {renderFace && renderFace()}
                        </Pressable>
                    </Animated.View>
                    <Animated.View
                        style={[
                            { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
                            { paddingHorizontal: 16, borderRadius: 20 },
                            cardFirstLevelStyle
                        ]}
                        pointerEvents={expandedPointerEvents}
                    >
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
                        pointerEvents={collapsedPointerEvents}
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
                        pointerEvents={collapsedPointerEvents}
                    />
                </Animated.View>
            </View>
            <Animated.View style={{ paddingHorizontal: 16, overflow: 'hidden' }}>
                {remainingItems.map((item, index) => {
                    const itemView = renderItem(item, index + 3);
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
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1
                        })}
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
