import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View, StyleProp, ViewStyle, useWindowDimensions } from "react-native";
import { t } from "../../i18n/t";
import { Slide } from "./Slide";
import { useNetwork, useTheme } from "../../engine/hooks";
import { ThemeStyle } from "../../engine/state/theme";

const slides = (isTestnet: boolean, dark?: boolean) => [
    {
        upperNote: isTestnet ? t('welcome.sloganDev') : t('welcome.slogan'),
        title: t('welcome.slide_1.title'),
        subtitle: t('welcome.slide_1.subtitle'),
        illustration: dark ? require('@assets/slide_protected_dark.webp') : require('@assets/slide_protected.webp')
    },
    ...(isTestnet ?
        [{
            upperNote: isTestnet ? t('welcome.sloganDev') : t('welcome.slogan'),
            title: t('welcome.slide_2.title'),
            subtitle: t('welcome.slide_2.subtitle'),
            illustration: dark ? require('@assets/slide_card_dark.webp') : require('@assets/slide_card.webp')
        }] : []),
    {
        upperNote: isTestnet ? t('welcome.sloganDev') : t('welcome.slogan'),
        title: t('welcome.slide_3.title'),
        subtitle: t('welcome.slide_3.subtitle'),
        illustration: dark ? require('@assets/slide_fast_dark.webp') : require('@assets/slide_fast.webp')
    },
];

export const WelcomeSlider = memo(({ style }: { style?: StyleProp<ViewStyle> }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const dimensions = useWindowDimensions();

    const slidesComponents = slides(isTestnet, theme.style === ThemeStyle.Dark);

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
            if (activeSlide < slidesComponents.length - 1) {
                scrollRef.current?.scrollTo({ x: (activeSlide + 1) * dimensions.width, animated: true });
            } else {
                scrollRef.current?.scrollTo({ x: 0, animated: true });
            }
        }, 3500);

        return () => clearTimeout(timerId);

    }, [activeSlide, slidesComponents.length]);

    return (
        <View style={[{ flex: 1 }, style]}>
            <View style={{
                height: 44,
                flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                width: dimensions.width,
            }}>
                {slidesComponents.map((_, index) => {
                    return (
                        <View
                            key={`indicator-${index}`}
                            style={{
                                width: 14, height: 4,
                                borderRadius: 4,
                                backgroundColor: activeSlide === index ? theme.textPrimary : theme.border,
                                marginHorizontal: 4,
                            }}
                        />
                    )
                }
                )}
            </View>
            <ScrollView bounces={false}>
                <ScrollView
                    ref={scrollRef}
                    horizontal={true}
                    pagingEnabled={true}
                    snapToAlignment={'center'}
                    style={{ flexGrow: 1, width: dimensions.width }}
                    contentContainerStyle={{ width: dimensions.width * slidesComponents.length }}
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    onScroll={onScroll}
                    scrollEventThrottle={32}
                >
                    {slidesComponents.map((slide, index) => {
                        return (
                            <Slide
                                upperNote={slide.upperNote}
                                title={slide.title}
                                subtitle={slide.subtitle}
                                illustration={slide.illustration}
                                key={`slide-${index}`}
                            />
                        )
                    })}
                </ScrollView>
            </ScrollView>
        </View>
    );
});