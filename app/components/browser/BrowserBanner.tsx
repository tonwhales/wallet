import { memo, useCallback, useMemo } from "react";
import { BrowserBannerItem } from "./BrowserListings";
import { View, Text, Pressable } from "react-native";
import Animated, { Extrapolation, SharedValue, interpolate, useAnimatedStyle } from "react-native-reanimated";
import { ThemeType } from "../../engine/state/theme";
import { Typography } from "../styles";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import { extractDomain } from "../../engine/utils/extractDomain";
import { Image } from 'expo-image'
import { useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useSelectedAccount } from "../../engine/hooks";
import { holdersUrl, HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";

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

    const { isTestnet} = useNetwork();
    const selected = useSelectedAccount();
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    const needsEnrolment = useMemo(() => {
        if (holdersAccStatus?.state === HoldersUserState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [holdersAccStatus]);
    const onHoldersPress = useCallback(() => {
        if (needsEnrolment || !isHoldersReady) {
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: { type: HoldersAppParamsType.Create } }, isTestnet);
            return;
        }
        navigation.navigateHolders({ type: HoldersAppParamsType.Create }, isTestnet);
    }, [needsEnrolment, isHoldersReady, isTestnet]);

    const onPress = useCallback(() => {
        trackEvent(MixpanelEvent.ProductBannerClick, {
            id: banner.id,
            product_url: banner.product_url,
            type: 'banner'
        });

        if (banner.isHolders) {
            onHoldersPress();
            return;
        }

        const domain = extractDomain(banner.product_url);
        const titleComponent = (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 8 }}>
                    <View style={{
                        width: 24, height: 24,
                        borderRadius: 12,
                        backgroundColor: theme.accent,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>
                            {domain.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </View>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    {banner.title && (
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>
                            {banner.title}
                        </Text>
                    )}
                    <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                        {domain}
                    </Text>
                </View>
            </View>
        );

        navigation.navigateDAppWebView({
            lockNativeBack: true,
            safeMode: true,
            url: banner.product_url,
            title: banner.title ?? undefined,
            header: { titleComponent: titleComponent },
            useStatusBar: true,
            engine: 'ton-connect',
            refId: `browser-banner-${banner.id}`,
            controlls: {
                refresh: true,
                share: true,
                back: true,
                forward: true
            },
        });
    }, [banner, onHoldersPress]);

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
                    source={{ uri: banner.image_url || undefined }}
                    placeholder={require('@assets/banners/banner-placeholder.webp')}
                    transition={{
                        duration: 150,
                        timing: 'ease-in-out',
                        effect: 'cross-dissolve'
                    }}
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        borderRadius: 20,
                        height: boxWidth / 2,
                        width: boxWidth,
                    }}
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
                                    source={{ uri: banner.icon_url || undefined }}
                                    style={{ borderRadius: 10, marginRight: 8, height: 54, width: 54 }}
                                    placeholder={require('@assets/banners/banner-icon-placeholder.webp')}
                                    transition={{
                                        duration: 150,
                                        timing: 'ease-in-out',
                                        effect: 'cross-dissolve'
                                    }}
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