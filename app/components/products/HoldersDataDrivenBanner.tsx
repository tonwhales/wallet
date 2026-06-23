import React, { memo, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import i18n from "i18next";
import { Address } from "@ton/core";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useIsConnectAppReady, useHoldersAccountStatus, useNetwork, useTheme } from "../../engine/hooks";
import { useAppConfig } from "../../engine/hooks/useAppConfig";
import { useSupport } from "../../engine/hooks/support/useSupport";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { HoldersCustomBanner } from "../../engine/api/holders/fetchAddressInviteCheck";
import { holdersUrl, HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { HoldersAppParams, HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import { t } from "../../i18n/t";
import { Typography } from "../styles";

const gradientColors = ["#3F33CC", "#B341D9"];

// A support deeplink (vs an in-dapp path): the banner opens native Intercom directly instead of routing
// into the dapp webview. It's the SAME native Intercom the dapp uses (the dapp bridges support to native).
const SUPPORT_PATH = "/support";

// Bundled fallback illustration, used until/unless the server supplies a per-banner `imageUrl`. Hybrid by
// design: server image overrides, so design can swap artwork later with no app release.
const fallbackIllustration = require("@assets/banners/banner-holders.webp");

// A fully data-driven Holders/Altery banner: its content (title/subtitle/action), artwork and deep-link
// all come from the server (invite-check `banners`), so new banners and campaigns need no app release.
// Tapping opens the Holders dapp at the server-provided `path`. Several of these stack on the home and
// settings screens (the server decides the count and order).
export const HoldersDataDrivenBanner = memo(
    ({ banner, address, screen }: { banner: HoldersCustomBanner; address: Address; screen: "Home" | "Settings" }) => {
        const theme = useTheme();
        const { isTestnet } = useNetwork();
        const navigation = useTypedNavigation();
        const appConfig = useAppConfig();
        const { onSupportWithMessage } = useSupport();
        const holdersAccStatus = useHoldersAccountStatus(address).data;
        const url = holdersUrl(isTestnet);
        const isHoldersReady = useIsConnectAppReady(url);

        const needsEnrollment = holdersAccStatus?.state === HoldersUserState.NeedEnrollment;
        const walletStr = address.toString({ testOnly: isTestnet });
        const trackViews = appConfig?.features?.trackViews;

        const lang = i18n.language === "ru" ? "ru" : "en";
        const title = banner.content.title[lang] || banner.content.title.en;
        const subtitle = banner.content.subtitle[lang] || banner.content.subtitle.en;
        const action = banner.content.action[lang] || banner.content.action.en;

        // Impression tracking — parity with the legacy HoldersBanner (which the data-driven stack replaces);
        // without this the stack would log clicks but no views and break the banner funnel metrics.
        useEffect(() => {
            if (trackViews) {
                trackEvent(
                    MixpanelEvent.HoldersBannerView,
                    { id: banner.id, wallet: walletStr, isTestnet, screen },
                    isTestnet,
                    true,
                );
            }
        }, [trackViews, banner.id, walletStr, isTestnet, screen]);

        const onPress = useCallback(() => {
            trackEvent(
                MixpanelEvent.HoldersBanner,
                { id: banner.id, wallet: walletStr, isTestnet, screen },
                isTestnet,
                true,
            );

            // Support deeplink → open native Intercom directly with a prefilled message (the user is already
            // identified in Intercom). Same native composer the dapp opens via its support bridge — no
            // webview detour, so the user returns cleanly to this screen afterwards.
            if (banner.path?.startsWith(SUPPORT_PATH)) {
                onSupportWithMessage({ message: t("products.holders.physicalCard.supportMessage") });
                return;
            }

            // `path` drives where the banner lands inside the Holders dapp. Fall back to the create flow if
            // (defensively) the server sent a data-driven banner without one.
            const navParams: HoldersAppParams = banner.path
                ? { type: HoldersAppParamsType.Path, path: banner.path, query: {} }
                : { type: HoldersAppParamsType.Create };

            if (needsEnrollment || !isHoldersReady) {
                navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: navParams }, isTestnet);
                return;
            }
            navigation.navigateHolders(navParams, isTestnet);
        }, [
            banner.id,
            banner.path,
            walletStr,
            isTestnet,
            screen,
            needsEnrollment,
            isHoldersReady,
            url,
            navigation,
            onSupportWithMessage,
        ]);

        return (
            <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
                <Pressable
                    onPress={onPress}
                    style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.5 : 1 }]}
                >
                    <LinearGradient style={styles.gradient} colors={gradientColors} start={[0, 1]} end={[1, 0]} />
                    <View style={styles.row}>
                        <View style={styles.textColumn}>
                            <Text
                                style={[{ color: theme.textUnchangeable }, Typography.semiBold17_24]}
                                ellipsizeMode="tail"
                                numberOfLines={2}
                            >
                                {title}
                            </Text>
                            <Text
                                style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}
                                ellipsizeMode="tail"
                                numberOfLines={2}
                            >
                                {subtitle}
                            </Text>
                            <View style={styles.actionRow}>
                                <View style={[styles.actionPill, { backgroundColor: theme.textUnchangeable }]}>
                                    {/* Pill is always white (textUnchangeable), so the label must always be
                                        dark. textPrimaryInverted alone is white in light theme → invisible;
                                        mirror ChipActionBanner's theme-aware pick. */}
                                    <Text
                                        style={[
                                            {
                                                color:
                                                    theme.style === "dark"
                                                        ? theme.textPrimaryInverted
                                                        : theme.textPrimary,
                                            },
                                            Typography.medium15_20,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {action}
                                    </Text>
                                    <Image
                                        source={require("@assets/ic-chevron-right.png")}
                                        style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                                    />
                                </View>
                            </View>
                        </View>
                        <Image
                            style={styles.illustration}
                            contentFit="contain"
                            source={banner.imageUrl ? { uri: banner.imageUrl } : fallbackIllustration}
                        />
                    </View>
                </Pressable>
            </Animated.View>
        );
    },
);

const styles = StyleSheet.create({
    pressable: {
        minHeight: 106,
        borderRadius: 20,
        overflow: "hidden",
        padding: 20,
        marginTop: 16,
    },
    gradient: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    row: {
        flexDirection: "row",
        flexGrow: 1,
        alignItems: "center",
    },
    textColumn: {
        flex: 1,
        flexShrink: 1,
        gap: 7,
    },
    actionRow: {
        flexDirection: "row",
        flexShrink: 1,
    },
    actionPill: {
        flexDirection: "row",
        flexShrink: 1,
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 50,
        minHeight: 32,
        gap: 6,
    },
    illustration: {
        width: 120,
        height: 120,
        flexShrink: 0,
    },
});
