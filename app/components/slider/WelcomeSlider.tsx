import React, { useEffect, useRef } from "react";
import { ScrollView, View, StyleProp, ViewStyle } from "react-native";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useDimensions } from "@react-native-community/hooks";
import { t } from "../../i18n/t";
import { Slide } from "./Slide";

const slides = (isTestnet: boolean) => [
    {
        upperNote: isTestnet ? t('welcome.sloganDev') : t('welcome.slogan'),
        title: t('welcome.slide_1.title'),
        subtitle: t('welcome.slide_1.subtitle'),
        illustration: require('../../../assets/slide_protected.webp')
    },
    ...(isTestnet ?
        [{
            upperNote: isTestnet ? t('welcome.sloganDev') : t('welcome.slogan'),
            title: t('welcome.slide_2.title'),
            subtitle: t('welcome.slide_2.subtitle'),
            illustration: require('../../../assets/slide_card.webp')
        }] : []),
    {
        upperNote: isTestnet ? t('welcome.sloganDev') : t('welcome.slogan'),
        title: t('welcome.slide_3.title'),
        subtitle: t('welcome.slide_3.subtitle'),
        illustration: require('../../../assets/slide_fast.webp')
    },
];

export const WelcomeSlider = React.memo(({ style }: { style?: StyleProp<ViewStyle> }) => {
    const { Theme, AppConfig } = useAppConfig();
    const dimensions = useDimensions();
    const slidesComponents = slides(AppConfig.isTestnet);

    const scrollRef = useRef<ScrollView>(null);

    const [activeSlide, setActiveSlide] = React.useState(0);

    const onScroll = React.useCallback((event: any) => {
        const slide = Math.ceil(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
        if (slide !== activeSlide) {
            setActiveSlide(slide);
        }
    }, [activeSlide]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            if (activeSlide < slidesComponents.length - 1) {
                scrollRef.current?.scrollTo({ x: (activeSlide + 1) * dimensions.screen.width, animated: true });
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
                width: dimensions.screen.width,
            }}>
                {slidesComponents.map((_, index) => {
                    return (
                        <View
                            key={`indicator-${index}`}
                            style={{
                                width: 14, height: 4,
                                borderRadius: 4,
                                backgroundColor: activeSlide === index ? 'black' : Theme.mediumGrey,
                                marginHorizontal: 4,
                            }}
                        />
                    )
                }
                )}
            </View>
            <ScrollView
                ref={scrollRef}
                horizontal={true}
                pagingEnabled={true}
                snapToAlignment={'center'}
                style={{ flexGrow: 1, width: dimensions.screen.width }}
                contentContainerStyle={{ width: dimensions.screen.width * slidesComponents.length }}
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
        </View>
    );
});