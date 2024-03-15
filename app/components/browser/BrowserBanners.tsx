import { memo, useCallback, useEffect, useRef, useState } from "react";
import { BrowserBannerItem } from "./BrowserListings";
import { ScrollView } from "react-native";
import { useDimensions } from "@react-native-community/hooks";
import { BrowserBanner } from "./BrowserBanner";

export const BrowserBanners = memo(({ banners }: { banners: BrowserBannerItem[] }) => {
    const dimensions = useDimensions();

    const scrollRef = useRef<ScrollView>(null);
    const [activeSlide, setActiveSlide] = useState(0);

    const onScroll = useCallback((event: any) => {
        const slide = Math.ceil(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
        if (slide !== activeSlide) {
            setActiveSlide(slide);
        }
    }, [activeSlide]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            if (activeSlide < banners.length - 1) {
                scrollRef.current?.scrollTo({ x: (activeSlide + 1) * dimensions.screen.width, animated: true });
            } else {
                scrollRef.current?.scrollTo({ x: 0, animated: true });
            }
        }, 3500);

        return () => clearTimeout(timerId);

    }, [activeSlide, banners.length]);

    console.log('BrowserBanners', banners.length);

    return (
        <ScrollView
            ref={scrollRef}
            horizontal={true}
            onScroll={onScroll}
            pagingEnabled={true}
            snapToAlignment={'center'}
            style={{ flexGrow: 1, width: dimensions.screen.width }}
            contentContainerStyle={{ width: dimensions.screen.width * banners.length, gap: 8 }}
            showsHorizontalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={32}
        >
            {banners.map((banner, i) => (
                <BrowserBanner
                    dimensions={dimensions}
                    key={i}
                    banner={banner}
                />
            ))}
        </ScrollView>
    );
});