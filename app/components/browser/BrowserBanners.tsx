import { memo, useCallback, useEffect, useRef, useState } from "react";
import { BrowserBannerItem } from "./BrowserListings";
import { FlatList, Platform, useWindowDimensions, View, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { BrowserBanner } from "./BrowserBanner";
import { useSharedValue } from "react-native-reanimated";
import { useTheme } from "../../engine/hooks";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { warn } from "../../utils/log";

export const BrowserBanners = memo(({ banners }: { banners: BrowserBannerItem[] }) => {
    const dimensions = useWindowDimensions();
    const theme = useTheme();
    const navigation = useTypedNavigation();

    const scrollRef = useRef<FlatList>(null);
    const isPressed = useRef(false);
    const isScrolling = useRef(false);
    const [activeSlide, setActiveSlide] = useState(0);

    const scrollViewWidth = dimensions.width
    const boxWidth = scrollViewWidth * 0.85;
    const boxDistance = scrollViewWidth - boxWidth;
    const halfBoxDistance = boxDistance / 2;

    const pan = useSharedValue(0);

    useEffect(() => {
        if (banners.length === 0) return;

        const timerId = setTimeout(() => {
            if (banners.length === 0) return;
            if (isScrolling.current) return

            if (activeSlide < banners.length - 1 && !isPressed.current) {
                scrollRef.current?.scrollToIndex({
                    index: activeSlide + 1,
                    viewOffset: boxWidth * 0.09,
                    animated: true
                });
            } else if (!isPressed.current) {
                scrollRef.current?.scrollToIndex({
                    index: 0,
                    viewOffset: boxWidth * 0.09,
                    animated: true
                });
            }
        }, 1000 * 3);

        return () => clearTimeout(timerId);
    }, [activeSlide, banners.length]);

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollOffset = event.nativeEvent.contentOffset.x + halfBoxDistance;
        const activeSlide = 1 + Math.floor((scrollOffset - 64) / boxWidth);
        pan.value = event.nativeEvent.contentOffset.x;
        setActiveSlide(activeSlide);
    }, [halfBoxDistance, activeSlide, boxWidth]);

    const renderItem = useCallback(({ item, index }: { item: BrowserBannerItem, index: number }) => {
        return (
            <View
                key={`${index}-${item.id}`}
                style={Platform.select({
                    android: {
                        paddingLeft: index === 0 ? halfBoxDistance : 0,
                        paddingRight: index === banners.length - 1 ? halfBoxDistance : 0,
                    }
                })}
            >
                <BrowserBanner
                    banner={item}
                    pan={pan}
                    boxWidth={boxWidth}
                    index={index}
                    halfBoxDistance={halfBoxDistance}
                    theme={theme}
                    navigation={navigation}
                />
            </View>
        );
    }, [halfBoxDistance, boxWidth, theme, navigation, pan, banners.length]);

    const onScrollToIndexFailed = useCallback(() => {
        warn('Failed to scroll to index');
        if (banners.length === 0) return;
        scrollRef.current?.scrollToIndex({ index: 0, animated: false });
    }, [banners.length]);

    return (
        <FlatList
            ref={scrollRef}
            data={banners}
            horizontal={true}
            snapToInterval={
                boxWidth
                + Platform.select({
                    // wierd calculation to account for contentInset for android
                    android: 20 - (activeSlide === banners.length - 2 ? 8 : 0),
                    ios: 0,
                    default: 0
                })
            }
            contentInset={{
                left: halfBoxDistance,
                right: halfBoxDistance,
            }}
            onScrollAnimationEnd={() => isScrolling.current = false}
            onScrollBeginDrag={() => {
                isPressed.current = true;
                isScrolling.current = false;
            }}
            onScrollEndDrag={() => isPressed.current = false}
            onScrollToIndexFailed={onScrollToIndexFailed}
            contentOffset={{ x: halfBoxDistance * -1, y: 0 }}
            snapToAlignment={'center'}
            keyExtractor={(item, index) => `banner-${index}-${item.id}`}
            style={{ flexGrow: 1, width: dimensions.width }}
            onScroll={onScroll}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 16 }}
            contentInsetAdjustmentBehavior={'never'}
            decelerationRate={Platform.select({ ios: 0.9, android: 1 })}
            automaticallyAdjustContentInsets={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={24}
        />
    );
});