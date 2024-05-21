import { useFocusEffect } from "@react-navigation/native";
import { Mixpanel, MixpanelProperties } from "mixpanel-react-native";
import { useCallback, useEffect } from "react";
import { warn } from "../utils/log";
import { IS_SANDBOX } from '../engine/state/network';

export enum MixpanelEvent {
    Reset = 'reset',
    Screen = 'screen',
    LinkReceived = 'link_received',
    NotificationReceived = 'notification_received',
    AppOpen = 'app_open',
    AppClose = 'app_close',
    Holders = 'holders',
    HoldersEnrollment = 'holders_entrollment',
    HoldersInfo = 'holders_info',
    HoldersInfoClose = 'holders_info_close',
    HoldersEnrollmentClose = 'holders_entrollment_close',
    HoldersClose = 'holders_close',
    AppInstall = 'app_install',
    AppInstallCancel = 'app_install_cancel',
    AppUninstall = 'app_uninstall',
    Connect = 'connect',
    Transfer = 'transfer',
    TransferCancel = 'transfer_cancel',
    ProductBannerClick = 'product_banner_click',
    BrowserBannerShown = 'browser_banner_shown',
}

let mixpanel = __DEV__
    ? new Mixpanel("b4b856b618ade30de503c189af079566") // Dev mode
    : IS_SANDBOX
        ? new Mixpanel("3f9efc81525f5bc5e5d047595d4d8ac9") // Sandbox
        : new Mixpanel("67a554fa4f2b98ae8785878bb4de73dc"); // Production
mixpanel.init();

export function useTrackScreen(screen: string, isTestnet: boolean, properties?: MixpanelProperties) {
    useFocusEffect(
        useCallback(() => {
            trackScreen(screen, properties, isTestnet);
        }, [])
    );
}

export function trackScreen(screen: string, properties?: MixpanelProperties, isTestnet?: boolean) {
    trackEvent(MixpanelEvent.Screen, { screen: screen, ...properties }, isTestnet);
}

export function mixpanelInst(isTestnet?: boolean) {
    if (isTestnet !== IS_SANDBOX) {
        mixpanel = __DEV__
            ? new Mixpanel("b4b856b618ade30de503c189af079566") // Dev mode
            : isTestnet
                ? new Mixpanel("3f9efc81525f5bc5e5d047595d4d8ac9") // Sandbox
                : new Mixpanel("67a554fa4f2b98ae8785878bb4de73dc"); // Production
        mixpanel.init();
        if (__DEV__) {
            mixpanel.setLoggingEnabled(true);
        }
    }
    return mixpanel;
}

export function trackEvent(eventName: MixpanelEvent, properties?: MixpanelProperties, isTestnet?: boolean) {
    try {
        mixpanelInst(isTestnet).track(eventName, properties);
    } catch (error) {
        warn(error);
    }
}

export function useTrackEvent(event: MixpanelEvent, properties?: MixpanelProperties, isTestnet?: boolean) {
    useEffect(() => {
        trackEvent(event, properties, isTestnet);
    }, [])
}

export function mixpanelFlush(isTestnet?: boolean) {
    mixpanelInst(isTestnet).flush();
}

export function mixpanelReset(isTestnet?: boolean) {
    mixpanelInst(isTestnet).reset();
}

export function mixpanelIdentify(id: string, isTestnet?: boolean) {
    mixpanelInst(isTestnet).identify(id);
}