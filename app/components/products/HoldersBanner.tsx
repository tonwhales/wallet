import React, { memo, useEffect } from "react";
import { View } from "react-native";
import { useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { HoldersCustomBanner } from "../../engine/api/holders/fetchAddressInviteCheck";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useAppConfig } from "../../engine/hooks/useAppConfig";
import { Address } from "@ton/core";
import { getDogsRef } from "../../engine/holders/dogsUtils";
import { CardActionBanner } from "./CardActionBanner";
import { ChipActionBanner } from "./ChipActionBanner";
import { IconBanner } from "./IconBanner";

export const HoldersBanner = memo((props: { onPress?: () => void, isSettings?: boolean, address: Address } & HoldersCustomBanner) => {
    const { isTestnet } = useNetwork();
    const { content, onPress: onClick, id, isSettings, address } = props;
    const selectedAccount = useSelectedAccount();
    const appConfig = useAppConfig();

    const trackViews = appConfig?.features?.trackViews;
    const wallet = selectedAccount?.addressString;
    const screen = isSettings ? 'Settings' : 'Home';

    const isDogs = getDogsRef();

    useEffect(() => {
        if (trackViews) {
            trackEvent(
                MixpanelEvent.HoldersBannerView,
                { id, wallet, isTestnet, screen, isDogs },
                isTestnet,
                true
            );
        }
    }, [trackViews, isTestnet, id, wallet, screen]);

    const onPress = () => {
        trackEvent(
            MixpanelEvent.HoldersBanner,
            { id, wallet, isTestnet, screen, isDogs },
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
        <View style={{ marginTop: 16 }}>
            <Animated.View
                entering={FadeInUp}
                exiting={FadeOutDown}
                style={{ paddingHorizontal: isSettings ? 0 : 16 }}
            >
                {banner}
            </Animated.View>
        </View>
    );
});
