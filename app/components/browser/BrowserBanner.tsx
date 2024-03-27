import { memo, useCallback } from "react";
import { BrowserBannerItem } from "./BrowserListings";
import { View, Text, Image, Pressable } from "react-native";
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
            engine: 'ton-connect',
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
                {(banner.title || banner.description || banner.icon_url) && (
                    <View style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0, top: 0,
                        padding: 16,
                        justifyContent: 'flex-end'
                    }}>
                        {(banner.title || banner.description) && (
                            <Canvas style={{
                                flexGrow: 1,
                                position: 'absolute',
                                top: -1, left: -1, right: -1, bottom: -1,
                                opacity: 0.5
                            }}>
                                <Rect
                                    x={0} y={0}
                                    width={boxWidth + 1} height={boxWidth / 2 + 2}
                                >
                                    <LinearGradient
                                        start={vec(0, boxWidth / 2)}
                                        end={vec(0, (boxWidth / 2) - 112)}
                                        colors={[theme.black, theme.transparent]}
                                    />
                                </Rect>
                            </Canvas>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {banner.icon_url && (
                                <Image
                                    height={54}
                                    width={54}
                                    source={{ uri: banner.icon_url || undefined }}
                                    style={{ borderRadius: 10, marginRight: 8 }}
                                />
                            )}
                            <View style={{ justifyContent: 'space-between', flexShrink: 1 }}>
                                {banner.title && (
                                    <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold20_28]}>
                                        {banner.title}
                                    </Text>
                                )}
                                {banner.description && (
                                    <Text
                                        style={[{ color: theme.textUnchangeable, opacity: 0.9 }, Typography.regular13_18]}
                                        numberOfLines={2}
                                        ellipsizeMode={'tail'}
                                    >
                                        {banner.description}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
});