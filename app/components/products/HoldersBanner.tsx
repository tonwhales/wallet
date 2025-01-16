import React, { memo, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useHoldersAccountStatus, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import i18n from 'i18next';
import { Image, ImageSource } from 'expo-image';
import { HoldersBannerContent, HoldersCustomBanner } from "../../engine/api/holders/fetchAddressInviteCheck";
import { Typography } from "../styles";
import { LinearGradient } from "expo-linear-gradient";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { ItemDivider } from "../ItemDivider";
import { BlurView } from "expo-blur";
import { useAppConfig } from "../../engine/hooks/useAppConfig";
import { Address } from "@ton/core";
import { HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { t } from "../../i18n/t";

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

type BannerStatus = 'not-active' | 'email' | 'kyc' | 'ready' | 'error';

const ChipActionBanner = memo(({ address, onPress, content, gradient }: { address: Address, onPress: () => void, content: HoldersBannerContent, gradient?: boolean }) => {
    const theme = useTheme();
    const holdersAccStatus = useHoldersAccountStatus(address).data;

    let bannerStatus: BannerStatus = 'not-active';

    switch (holdersAccStatus?.state) {
        case HoldersUserState.NeedEmail:
            bannerStatus = 'email';
            break;
        case HoldersUserState.NeedKyc:
            const kyc = holdersAccStatus.kycStatus;
            if (kyc?.completed) {
                bannerStatus = kyc.result === 'GREEN' ? 'ready' : 'error';
                break;
            }
            bannerStatus = 'kyc';
            break;
        case HoldersUserState.Ok:
            bannerStatus = 'ready';
            break;
        default:
            break;
    }

    const lang = i18n.language === 'ru' ? 'ru' : 'en';
    const title = content.title[lang] || content.title.en;
    let subtitle = content.subtitle[lang] || content.subtitle.en;
    let action = content.action[lang] || content.action.en;
    let actionIc: ImageSource | undefined = undefined;
    const textColor = gradient ? theme.textUnchangeable : theme.textPrimary;
    const textSecondaryColor = gradient ? theme.textUnchangeable : theme.textSecondary;
    let actionTextcolor = gradient
        ? (theme.style === 'dark' ? theme.textPrimaryInverted : theme.textPrimary)
        : theme.textUnchangeable;
    let actionBackgroundColor = gradient ? theme.textUnchangeable : theme.accent;

    switch (bannerStatus) {
        case 'email':
            subtitle = t('products.holders.banner.fewMore');
            action = t('products.holders.banner.emailAction');
            actionIc = require('@assets/ic-banner-more-steps.png');
            break;
        case 'kyc':
            subtitle = t('products.holders.banner.fewMore');
            action = t('products.holders.banner.kycAction');
            actionIc = require('@assets/ic-banner-more-steps.png');
            break;
        case 'ready':
            subtitle = t('products.holders.banner.ready');
            action = t('products.holders.banner.readyAction');
            actionIc = require('@assets/ic-banner-ready.png');
            break;
        case 'error':
            action = t('products.holders.banner.failedAction');
            actionIc = require('@assets/ic-banner-failed.png');
            break;
        default:
            break;
    }

    if (!!actionIc) {
        actionBackgroundColor = theme.divider;
        actionTextcolor = theme.textPrimary;
    }

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
                            minHeight: 32,
                            gap: 6
                        }}>
                            {actionIc && (
                                <Image
                                    source={actionIc}
                                    style={{ height: 16, width: 16 }}
                                />
                            )}
                            <Text
                                style={[
                                    { color: actionTextcolor, flexShrink: 1 },
                                    Typography.medium15_20,
                                    { lineHeight: undefined }
                                ]}
                                adjustsFontSizeToFit
                                minimumFontScale={0.85}
                                numberOfLines={2}
                                lineBreakMode="tail"
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

    const icStyle = noAction ? styles.iconNoAction : [styles.icon, { backgroundColor: theme.accent }];
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

export const HoldersBanner = memo((props: { onPress?: () => void, isSettings?: boolean, address: Address } & HoldersCustomBanner) => {
    const { isTestnet } = useNetwork();
    const { content, onPress: onClick, id, isSettings, address } = props;
    const selectedAccount = useSelectedAccount();
    const appConfig = useAppConfig();

    const trackViews = appConfig?.features?.trackViews;
    const wallet = selectedAccount?.addressString;
    const screen = isSettings ? 'Settings' : 'Home';

    useEffect(() => {
        if (trackViews) {
            trackEvent(
                MixpanelEvent.HoldersBannerView,
                { id, wallet, isTestnet, screen },
                isTestnet,
                true
            );
        }
    }, [trackViews, isTestnet, id, wallet, screen]);

    const onPress = () => {
        trackEvent(
            MixpanelEvent.HoldersBanner,
            { id, wallet, isTestnet, screen },
            isTestnet,
            true
        );
        onClick?.();
    }

    let banner = <ChipActionBanner address={address} onPress={onPress} content={content} />;

    if (isSettings) {
        switch (id) {
            case 1: banner = <IconBanner onPress={onPress} content={content} />; break;
            case 2: banner = <CardActionBanner onPress={onPress} content={content} />; break;
            case 3: banner = <IconBanner onPress={onPress} content={content} noAction />; break;
            default: banner = <IconBanner onPress={onPress} content={content} noAction />; break;
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