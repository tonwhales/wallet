import React, { memo, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useHoldersAccountStatus, useTheme } from "../../engine/hooks";
import i18n from 'i18next';
import { Image, ImageSource } from 'expo-image';
import { HoldersBannerContent } from "../../engine/api/holders/fetchAddressInviteCheck";
import { Typography } from "../styles";
import { LinearGradient } from "expo-linear-gradient";
import { t } from "../../i18n/t";
import { Address } from "@ton/core";
import { HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { getFailedBannerClicked, setFailedBannerClicked } from "../../utils/holders/holdersBanner";
import { getDogsRef } from "../../engine/holders/dogsUtils";

const gradientColors = ['#3F33CC', '#B341D9'];

type BannerStatus = 'not-active' | 'email' | 'kyc' | 'ready' | 'error';

export const ChipActionBanner = memo(({ address, onPress, content, gradient }: { address: Address, onPress: () => void, content: HoldersBannerContent, gradient?: boolean }) => {
    const theme = useTheme();
    const holdersAccStatus = useHoldersAccountStatus(address).data;
    const isDogs = getDogsRef();

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

    const [failedClicked, setFailedClicked] = useState(getFailedBannerClicked());

    const setClicked = (clicked: boolean) => {
        setFailedClicked(clicked);
        setFailedBannerClicked(clicked);
    }

    const onClick = () => {
        onPress();
        if (bannerStatus === 'error') {
            setClicked(true);
        }
    }

    useEffect(() => {
        const failed = holdersAccStatus?.state === HoldersUserState.NeedKyc
            && holdersAccStatus.kycStatus?.completed === true
            && holdersAccStatus.kycStatus?.result !== 'GREEN';

        if (!failed) {
            setClicked(false);
        }
    }, [holdersAccStatus?.state]);

    if (bannerStatus === 'error' && failedClicked) {
        bannerStatus = 'not-active';
    }

    const lang = i18n.language === 'ru' ? 'ru' : 'en';
    let title = content.title[lang] || content.title.en;
    let subtitle = content.subtitle[lang] || content.subtitle.en;
    let action = content.action[lang] || content.action.en;
    let actionIc: ImageSource | undefined = undefined;
    const textColor = gradient ? theme.textUnchangeable : theme.textPrimary;
    const textSecondaryColor = gradient ? theme.textUnchangeable : theme.textSecondary;
    let actionTextcolor = gradient
        ? (theme.style === 'dark' ? theme.textPrimaryInverted : theme.textPrimary)
        : theme.textUnchangeable;
    let actionBackgroundColor = gradient ? theme.textUnchangeable : theme.accent;
    let iconSource = require('@assets/banners/holders-banner-chip-action.png');

    if (isDogs) {
        title = t('products.holders.banner.dogsTitle');
        subtitle = t('products.holders.banner.dogsSubtitle');
        iconSource = require('@assets/banners/holders-banner-dogs.webp');
    }

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
            onPress={onClick}
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
                    source={iconSource}
                />
            </View>
        </Pressable>
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
    img_chip: {
        width: 132,
        height: 132
    },
});
