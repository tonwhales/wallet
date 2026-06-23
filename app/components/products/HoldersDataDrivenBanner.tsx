import React, { memo, useCallback, useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Image as RNImage } from "react-native";
import { Image } from "expo-image";
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

// A support deeplink (vs an in-dapp path): open native Intercom directly instead of routing into the
// dapp webview — the same native Intercom the dapp uses (it bridges support to native).
const SUPPORT_PATH = "/support";

// Used only for a server-supplied (remote) imageUrl, where we can't read intrinsic dimensions up front;
// the server art should be authored to roughly this ratio. Bundled art uses its own intrinsic ratio.
const DEFAULT_ASPECT_RATIO = 1101 / 360;

// Default full-bleed artwork, bundled from the dapp (same PNGs), keyed by the server banner id (101-105
// from the issuer resolver). Physical states have light + dark variants, theme-picked like the dapp;
// onboarding/issue-card are single dark-gradient art. A server `imageUrl` overrides everything (design can
// swap art with no app release).
const PHYSICAL_ART = {
    dark: require("@assets/banners/altery/physical-dark.png"),
    light: require("@assets/banners/altery/physical-light.png"),
};
const ONBOARDING_ART: { dark: number; light?: number } = {
    dark: require("@assets/banners/altery/card.png"),
};
const BANNER_ART: Record<number, { dark: number; light?: number }> = {
    101: ONBOARDING_ART, // onboarding
    102: { dark: require("@assets/banners/altery/issue-card.png") }, // issue-card
    103: PHYSICAL_ART, // physical-order
    104: PHYSICAL_ART, // physical-on-the-way
    105: PHYSICAL_ART, // physical-link
};

// Fully data-driven Holders/Altery banner: artwork, content (title/action) and deep-link all come from the
// server (invite-check `banners`). Full-bleed baked-artwork style (matches the dapp): the image is the whole
// banner, the title + button are overlaid. Several stack on the home / settings screens.
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
        const action = banner.content.action[lang] || banner.content.action.en;

        const artSet = BANNER_ART[banner.id] ?? ONBOARDING_ART;
        // Light artwork only for bundled physical banners in the light app theme (matches the dapp). A
        // server imageUrl or any dark-only art keeps the dark overlay (white text).
        const useLightArt = !banner.imageUrl && theme.style === "light" && artSet.light != null;
        const bundledArt = useLightArt ? (artSet.light as number) : artSet.dark;
        const imageSource = banner.imageUrl ? { uri: banner.imageUrl } : bundledArt;
        // Render the image at its natural proportions (like the dapp's height:auto). For bundled art we read
        // the intrinsic ratio; for a remote imageUrl we fall back to the standard banner ratio.
        const aspectRatio = useMemo(() => {
            if (banner.imageUrl) {
                return DEFAULT_ASPECT_RATIO;
            }
            const src = RNImage.resolveAssetSource(bundledArt);
            return src && src.height > 0 ? src.width / src.height : DEFAULT_ASPECT_RATIO;
        }, [banner.imageUrl, bundledArt]);

        // Overlay colors flip with artwork brightness: dark art → white title + white pill (dark label);
        // light art → dark title + dark pill (white label).
        const titleColor = useLightArt ? "#1c1c1e" : theme.textUnchangeable;
        const pillBackground = useLightArt ? "#1c1c1e" : "#ffffff";
        const pillTextColor = useLightArt ? "#ffffff" : "#1c1c1e";

        // Impression tracking — parity with the legacy HoldersBanner (which the data-driven stack replaces).
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
            // identified in Intercom). No webview detour, so the user returns cleanly to this screen.
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
                <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.5 : 1 }]}>
                    <Image style={[styles.image, { aspectRatio }]} source={imageSource} contentFit="cover" />
                    {/* Overlay matches the dapp banner: title + pill button on the left ~64%, vertically centered.
                        Art is always dark, so the title is white and the pill is white with dark text. */}
                    <View style={styles.overlay}>
                        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
                        <View style={[styles.button, { backgroundColor: pillBackground }]}>
                            <Text style={[Typography.medium15_20, { color: pillTextColor }]}>{action}</Text>
                        </View>
                    </View>
                </Pressable>
            </Animated.View>
        );
    },
);

const styles = StyleSheet.create({
    pressable: {
        marginTop: 16,
        borderRadius: 20,
        overflow: "hidden",
    },
    image: {
        width: "100%",
    },
    overlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        maxWidth: "64%",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 10,
        padding: 20,
    },
    title: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "600",
    },
    button: {
        alignSelf: "flex-start",
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 12,
    },
});
