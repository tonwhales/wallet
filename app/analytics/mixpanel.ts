import { useFocusEffect } from "@react-navigation/native";
import { Mixpanel, MixpanelProperties } from "mixpanel-react-native";
import { useCallback, useEffect } from "react";
import { AppConfig } from "../AppConfig";
import { warn } from "../utils/log";

export const mixpanel = __DEV__
    ? new Mixpanel("b4b856b618ade30de503c189af079566") // Dev mode
    : AppConfig.isTestnet
        ? new Mixpanel("3f9efc81525f5bc5e5d047595d4d8ac9") // Sandbox
        : new Mixpanel("67a554fa4f2b98ae8785878bb4de73dc"); // Production

export enum MixpanelEvent {
    Reset = 'reset',
    Screen = 'screen',
    LinkReceived = 'link_received',
    NotificationReceived = 'notification_received',
    AppOpen = 'app_open',
    AppClose = 'app_close',
    ZenPay = 'zen_pay',
    ZenPayEnrollment = 'zen_pay_entrollment',
    ZenPayEnrollmentClose = 'zen_pay_entrollment_close',
    ZenPayClose = 'zen_pay_close',
    AppInstall = 'app_install',
    AppInstallCancel = 'app_install_cancel',
    AppUninstall = 'app_uninstall',
    Connect = 'connect',
    Transfer = 'transfer',
    TransferCancel = 'transfer_cancel',
}

export function useTrackScreen(screen: string, properties?: MixpanelProperties) {
    useFocusEffect(
        useCallback(() => {
            trackScreen(screen, properties);
        }, [])
    );
}

export function trackScreen(screen: string, properties?: MixpanelProperties) {
    trackEvent(MixpanelEvent.Screen, { screen: screen, ...properties });
}

export function trackEvent(eventName: MixpanelEvent, properties?: MixpanelProperties) {
    try {
        mixpanel.track(eventName, properties);
    } catch (error) {
        warn(error);
    }
}

export function useTrackEvent(event: MixpanelEvent, properties?: MixpanelProperties) {
    useEffect(() => {
        trackEvent(event, properties);
    }, [])
}