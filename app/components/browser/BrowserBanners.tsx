import { memo, useEffect, useRef, useState } from "react";
import { BrowserBannerItem } from "./BrowserListings";
import { FlatList, Platform, View } from "react-native";
import { useDimensions } from "@react-native-community/hooks";
import { BrowserBanner } from "./BrowserBanner";
import { useSharedValue } from "react-native-reanimated";
import { useTheme } from "../../engine/hooks";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const BrowserBanners = memo(({ banners }: { banners: BrowserBannerItem[] }) => {
    const dimensions = useDimensions();
    const theme = useTheme();
    const navigation = useTypedNavigation();

    const scrollRef = useRef<FlatList>(null);
    const isPressed = useRef(false);
    const [activeSlide, setActiveSlide] = useState(0);

    const [scrollViewWidth, setScrollViewWidth] = useState(0);
    const boxWidth = scrollViewWidth * 0.85;
    const boxDistance = scrollViewWidth - boxWidth;
    const halfBoxDistance = boxDistance / 2;

    const pan = useSharedValue(0);

    useEffect(() => {
        if (banners.length === 0) return;
        const timerId = setTimeout(() => {
            if (banners.length === 0) return;
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
        }, 1000 * 8);

        return () => clearTimeout(timerId);
    }, [activeSlide, banners.length]);

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
            onScrollBeginDrag={() => isPressed.current = true}
            onScrollEndDrag={() => isPressed.current = false}
            contentOffset={{ x: halfBoxDistance * -1, y: 0 }}
            onLayout={(e) => {
                setScrollViewWidth(e.nativeEvent.layout.width);
            }}
            snapToAlignment={'center'}
            keyExtractor={(item, index) => `${index}-${item.id}`}
            onScroll={(e) => {
                const scrollOffset = e.nativeEvent.contentOffset.x + halfBoxDistance;
                const activeSlide = 1 + Math.floor((scrollOffset - 64) / boxWidth);
                pan.value = e.nativeEvent.contentOffset.x;
                setActiveSlide(activeSlide);
            }}
            renderItem={({ item, index }) => (
                <View
                    key={`${index}-${item.id}`}
                    style={{
                        paddingLeft: index === 0 ? halfBoxDistance : 0,
                        paddingRight: index === banners.length - 1 ? halfBoxDistance : 0,
                    }}
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
            )}
            style={{ flexGrow: 1, width: dimensions.screen.width }}
            contentContainerStyle={{ paddingVertical: 16 }}
            contentInsetAdjustmentBehavior={'never'}
            decelerationRate={'fast'}
            automaticallyAdjustContentInsets={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={24}
        />
    );
});