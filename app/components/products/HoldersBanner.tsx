import React, { memo, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import i18n from 'i18next';
import { Image } from 'expo-image';
import { HoldersBannerContent, HoldersCustomBanner } from "../../engine/api/holders/fetchAddressInviteCheck";
import { Typography } from "../styles";
import { LinearGradient } from "expo-linear-gradient";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { ItemDivider } from "../ItemDivider";
import { BlurView } from "expo-blur";
import { useAppConfig } from "../../engine/hooks/useAppConfig";

const gradientColors = ['#3F33CC', '#B341D9'];

const CardActionBanner = memo(({ onPress, content, gradient }: { onPress: () => void, content: HoldersBannerContent, gradient?: boolean }) => {
    const theme = useTheme();
    const lang = i18n.language === 'ru' ? 'ru' : 'en';
    const title = content.title[lang] || content.title.en;
    const subtitle = content.subtitle[lang] || content.subtitle.en;
    const action = content.action[lang] || content.action.en;

    const textColor = gradient ? theme.textUnchangeable : theme.textPrimary;
    const actionTextcolor = gradient ? theme.textUnchangeable : theme.accent;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => {
                return [
                    styles.pressable,
                    { opacity: pressed ? 0.5 : 1, backgroundColor: theme.surfaceOnBg, padding: 20 }
                ]
            }}
        >
            {gradient && (
                <LinearGradient
                    style={styles.gradient}
                    colors={gradientColors}
                    start={[0, 1]}
                    end={[1, 0]}
                />
            )}
            <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', gap: 8 }}>
                <View style={{
                    justifyContent: 'space-between',
                    flexGrow: 1, flexShrink: 1,
                    gap: 7
                }}>
                    <Text style={[{ color: textColor }, Typography.semiBold17_24]}
                        ellipsizeMode={'tail'}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                    <Text
                        style={[{ flex: 1, flexShrink: 1, color: textColor, opacity: 0.8, marginBottom: 8 }, Typography.regular15_20]}
                        ellipsizeMode={'tail'}
                        numberOfLines={3}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.95}
                    >
                        {subtitle}
                    </Text>
                </View>
                <Image
                    style={[styles.img_action, { marginBottom: -44, marginRight: -8 }]}
                    source={require('@assets/banners/holders-banner-card-action.png')}
                />
            </View>
            {gradient ? (
                <BlurView
                    style={{
                        position: 'absolute',
                        borderRadius: 20,
                        left: 0, right: 0,
                        bottom: 0,
                        height: 60
                    }}
                    intensity={50}
                    tint={theme.style === 'dark' ? 'dark' : 'light'}
                />
            ) : (
                <View style={{
                    backgroundColor: theme.surfaceOnBg,
                    position: 'absolute',
                    borderRadius: 20,
                    left: 0, right: 0,
                    bottom: 0,
                    height: 60
                }} />
            )}
            <View>
                {gradient ? (null) : (
                    <ItemDivider marginVertical={0} marginHorizontal={1} />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 16, justifyContent: 'space-between' }}>
                    <Text style={[{ color: actionTextcolor }, Typography.semiBold17_24]}>
                        {action}
                    </Text>
                    <Image
                        source={require('@assets/ic-chevron-right.png')}
                        style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                    />
                </View>
            </View>
        </Pressable>
    );
});

const ChipActionBanner = memo(({ onPress, content, gradient }: { onPress: () => void, content: HoldersBannerContent, gradient?: boolean }) => {
    const theme = useTheme();
    const lang = i18n.language === 'ru' ? 'ru' : 'en';
    const title = content.title[lang] || content.title.en;
    const subtitle = content.subtitle[lang] || content.subtitle.en;
    const action = content.action[lang] || content.action.en;
    const textColor = gradient ? theme.textUnchangeable : theme.textPrimary;
    const textSecondaryColor = gradient ? theme.textUnchangeable : theme.textSecondary;
    const actionTextcolor = gradient
        ? (theme.style === 'dark' ? theme.textPrimaryInverted : theme.textPrimary)
        : theme.textUnchangeable;
    const actionBackgroundColor = gradient ? theme.textUnchangeable : theme.accent;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => {
                return [
                    styles.pressable,
                    { opacity: pressed ? 0.5 : 1, backgroundColor: theme.surfaceOnBg, padding: 20 }
                ]
            }}
        >
            {gradient && (
                <LinearGradient
                    style={styles.gradient}
                    colors={gradientColors}
                    start={[0, 1]}
                    end={[1, 0]}
                />
            )}
            <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center' }}>
                <View style={{
                    flex: 1,
                    flexGrow: 1, flexShrink: 1,
                    gap: 7,
                }}>
                    <Text style={[{ color: textColor }, Typography.semiBold17_24]}
                        ellipsizeMode={'tail'}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                    <Text
                        style={[{ flex: 1, flexShrink: 1, color: textSecondaryColor, opacity: 0.8, marginBottom: 8 }, Typography.regular15_20]}
                        ellipsizeMode={'tail'}
                        numberOfLines={2}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.75}
                    >
                        {subtitle}
                    </Text>
                    <View style={{ flexDirection: 'row', flexShrink: 1 }}>
                        <View style={{
                            flexDirection: 'row', flexShrink: 1,
                            alignItems: 'center',
                            backgroundColor: actionBackgroundColor,
                            paddingHorizontal: 16, paddingVertical: 6,
                            borderRadius: 50,
                            gap: 6
                        }}>
                            <Text
                                style={[
                                    { color: actionTextcolor, textAlign: 'center', flexShrink: 1 },
                                    Typography.medium15_20
                                ]}
                                adjustsFontSizeToFit
                                minimumFontScale={0.7}
                                numberOfLines={1}
                            >
                                {action}
                            </Text>
                            <Image
                                source={require('@assets/ic-chevron-right.png')}
                                style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                            />
                        </View>
                    </View>
                </View>
                <Image
                    style={[styles.img_chip, { flex: 0.76 }]}
                    contentFit="contain"
                    source={require('@assets/banners/holders-banner-chip-action.png')}
                />
            </View>
        </Pressable>
    );
});

const IconBanner = memo(({ onPress, content, noAction }: { onPress: () => void, content: HoldersBannerContent, noAction?: boolean }) => {
    const theme = useTheme();
    const lang = i18n.language === 'ru' ? 'ru' : 'en';
    const title = content.title[lang] || content.title.en;
    const subtitle = content.subtitle[lang] || content.subtitle.en;
    const action = content.action[lang] || content.action.en;

    const icStyle = noAction? styles.iconNoAction : [styles.icon, { backgroundColor: theme.accent }];
    const ic = noAction ? require('@assets/ic-holders-card.png') : require('@assets/ic-banner-card.png');

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => {
                return [
                    styles.pressable,
                    { opacity: pressed ? 0.5 : 1, backgroundColor: theme.surfaceOnBg, minHeight: 0 }
                ]
            }}
        >
            <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', padding: 20, gap: 12 }}>
                <View style={icStyle}>
                    <Image
                        style={icStyle}
                        placeholder={ic}
                        contentFit={'contain'}
                    />
                </View>
                <View style={{
                    justifyContent: 'space-between',
                    flexGrow: 1, flexShrink: 1,
                }}>
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                        ellipsizeMode={'tail'}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                    <Text
                        style={[{ flex: 1, flexShrink: 1, color: theme.textSecondary, opacity: 0.8, }, Typography.regular15_20]}
                        ellipsizeMode={'tail'}
                        numberOfLines={3}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.95}
                    >
                        {subtitle}
                    </Text>
                </View>
                {!noAction ? (
                    <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: theme.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.medium15_20]}>
                            {action}
                        </Text>
                    </View>
                ) : (
                    <Image
                        source={require('@assets/ic-chevron-right.png')}
                        style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                    />
                )}
            </View>
        </Pressable>
    );
});

const GradientBanner = memo(({ onPress, content }: { onPress: () => void, content: HoldersBannerContent }) => {
    const theme = useTheme();
    const lang = i18n.language === 'ru' ? 'ru' : 'en';
    const title = content.title[lang] || content.title.en;
    const subtitle = content.subtitle[lang] || content.subtitle.en;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => {
                return [
                    styles.pressable,
                    { opacity: pressed ? 0.5 : 1, backgroundColor: theme.surfaceOnBg, }
                ]
            }}
        >
            <LinearGradient
                style={styles.gradient}
                colors={gradientColors}
                start={[0, 1]}
                end={[1, 0]}
            />
            <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center' }}>
                <View style={{
                    justifyContent: 'space-between', padding: 20,
                    flexGrow: 1, flexShrink: 1,
                }}>
                    <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold17_24]}
                        ellipsizeMode={'tail'}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                    <Text
                        style={[{ flex: 1, flexShrink: 1, color: theme.textUnchangeable, opacity: 0.8, }, Typography.regular15_20]}
                        ellipsizeMode={'tail'}
                        numberOfLines={3}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.95}
                    >
                        {subtitle}
                    </Text>
                </View>
                <Image
                    style={styles.img}
                    source={require('@assets/banners/holders-banner-img.png')}
                    contentFit={'contain'}
                />
            </View>
        </Pressable>
    );
});

export const HoldersBanner = memo((props: { onPress?: () => void, isSettings?: boolean } & HoldersCustomBanner) => {
    const { isTestnet } = useNetwork();
    const { content, onPress: onClick, id, isSettings } = props;
    const selectedAccount = useSelectedAccount();
    const appConfig = useAppConfig();

    const trackViews = appConfig?.features?.trackViews;
    const wallet = selectedAccount?.addressString;
    const screen = isSettings ? 'Settings' : 'Home';

    useEffect(() => {
        if (trackViews) {
            trackEvent(
                MixpanelEvent.HoldersBannerView,
                { id, wallet, isTestnet, screen }
            );
        }
    }, [trackViews, isTestnet, id, wallet, screen]);

    const onPress = () => {
        trackEvent(
            MixpanelEvent.HoldersBanner,
            { id, wallet, isTestnet, screen }
        );
        onClick?.();
    }

    let banner = <GradientBanner onPress={onPress} content={content} />;

    console.log({ id })

    if (isSettings) {
        switch (id) {
            case 1: banner = <IconBanner onPress={onPress} content={content} />; break;
            case 2: banner = <CardActionBanner onPress={onPress} content={content} />; break;
            case 3: banner = <IconBanner onPress={onPress} content={content} noAction />; break;
            default: banner = <IconBanner onPress={onPress} content={content} noAction />; break;
        }
    } else {
        switch (id) {
            case 1: banner = <IconBanner onPress={onPress} content={content} />; break;
            case 2: banner = <CardActionBanner onPress={onPress} content={content} />; break;
            case 3: banner = <CardActionBanner onPress={onPress} content={content} gradient={true} />; break;
            case 4: banner = <ChipActionBanner onPress={onPress} content={content} />; break;
            case 5: banner = <ChipActionBanner onPress={onPress} content={content} gradient={true} />; break;
            default: break;
        }
    }

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={isSettings ? { marginTop: 16 } : { paddingHorizontal: 16, marginVertical: 16 }}
        >
            {banner}
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    gradient: {
        position: 'absolute',
        borderRadius: 20,
        left: 0, right: 0,
        top: 0, bottom: 0
    },
    pressable: {
        minHeight: 106,
        borderRadius: 20,
        overflow: 'hidden',
    },
    img: {
        height: 106, width: 90,
        justifyContent: 'center', alignItems: 'center'
    },
    img_action: {
        width: 116,
        height: 126
    },
    img_chip: {
        width: 132,
        height: 132
    },
    icon: {
        width: 46, height: 46,
        borderRadius: 23,
        justifyContent: 'center', alignItems: 'center',
    },
    iconNoAction: {
        width: 24, height: 24,
        justifyContent: 'center', alignItems: 'center'
    }
});