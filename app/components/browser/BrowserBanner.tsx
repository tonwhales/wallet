import { memo, useCallback } from "react";
import { BrowserBannerItem } from "./BrowserListings";
import { View, Text, Image, Pressable } from "react-native";
import FastImage from "react-native-fast-image";
import Animated, { Extrapolation, SharedValue, interpolate, useAnimatedStyle } from "react-native-reanimated";
import { ThemeType } from "../../engine/state/theme";
import { Typography } from "../styles";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { TypedNavigation } from "../../utils/useTypedNavigation";

export const BrowserBanner = memo(({
    banner,
    pan,
    boxWidth,
    index,
    halfBoxDistance,
    theme,
    navigation
}: {
    banner: BrowserBannerItem,
    pan: SharedValue<number>,
    boxWidth: number,
    index: number,
    halfBoxDistance: number,
    theme: ThemeType,
    navigation: TypedNavigation
}) => {
    const animScale = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    scale: interpolate(
                        pan.value,
                        [
                            (index - 1) * boxWidth - halfBoxDistance,
                            index * boxWidth - halfBoxDistance,
                            (index + 1) * boxWidth - halfBoxDistance
                        ],
                        [0.9, 1, 0.9],
                        Extrapolation.CLAMP
                    )
                }
            ]
        };
    });

    const onPress = useCallback(() => {
        navigation.navigateDAppWebView({
            url: banner.product_url,
            title: banner.title ?? undefined,
            header: {
                title: banner.title ?? ''
            },
            useStatusBar: true,
            //     useMainButton?: boolean;
            //     useQueryAPI?: boolean;
            //     useToaster?: boolean;
            refId: `browser-banner-${banner.id}`
        })
    }, [banner]);

    return (
        <Animated.View style={animScale}>
            <Pressable
                style={({ pressed }) => ({
                    width: boxWidth,
                    height: boxWidth / 2,
                    borderRadius: 20,
                    overflow: 'hidden',
                    opacity: pressed ? 0.8 : 1
                })}
                onPress={onPress}
            >
                <Image
                    height={boxWidth / 2}
                    width={boxWidth}
                    source={{ uri: banner.image_url || undefined }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20 }}
                />
                {(banner.title || banner.description) && (
                    <>
                        <Canvas style={{
                            flexGrow: 1,
                            position: 'absolute',
                            top: -1, left: -1, right: -1, bottom: -1,
                            opacity: 0.5
                            // opacity: 1
                        }}>
                            <Rect x={0} y={0} width={boxWidth + 1} height={boxWidth / 2 + 2}>
                                <LinearGradient
                                    start={vec(0, 0)}
                                    end={vec(0, boxWidth / 2)}
                                    colors={[theme.surfaceOnBg, theme.accent]}
                                />
                            </Rect>
                        </Canvas>
                        <View style={{
                            position: 'absolute',
                            bottom: 16, left: 16, right: 16, top: 16,
                            justifyContent: 'space-between'
                        }}>
                            {banner.title && (
                                <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                                    {banner.title}
                                </Text>
                            )}
                            {banner.description && (
                                <Text style={[{ color: theme.textUnchangeable }, Typography.regular15_20]}>
                                    {banner.description}
                                </Text>
                            )}
                        </View>
                    </>
                )}
            </Pressable>
        </Animated.View>
    );
});