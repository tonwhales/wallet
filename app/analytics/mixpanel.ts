import { useFocusEffect } from "@react-navigation/native";
import { Mixpanel, MixpanelProperties } from "mixpanel-react-native";
import { useCallback, useEffect } from "react";
import { warn } from "../utils/log";
import { IS_SANDBOX } from '../engine/state/network';

const keys = require('@assets/keys.json');

export enum MixpanelEvent {
    Reset = 'reset',
    Screen = 'screen',
    AppOpen = 'app_open',
    AppClose = 'app_close',
    Holders = 'holders',
    HoldersReload = 'holders_reload',
    HoldersEnrollment = 'holders_entrollment',
    HoldersInfo = 'holders_info',
    HoldersInfoClose = 'holders_info_close',
    HoldersLoadingTime = 'holders_loading_time',
    holdersLongLoadingTime = 'holders_long_loading_time',
    HoldersEnrollmentClose = 'holders_entrollment_close',
    HoldersBanner = 'holders_banner',
    HoldersBannerView = 'holders_banner_view',
    HoldersClose = 'holders_close',
    HoldersChangelyBanner = 'holders_changely_banner',
    HoldersChangelyBannerClose = 'holders_changely_banner_close',
    Connect = 'connect',
    Transfer = 'transfer',
    TransferCancel = 'transfer_cancel',
    ProductBannerClick = 'product_banner_click',
    BrowserSearch = 'browser_search',
    AppStart = 'app_start',
    WalletCreate = 'wallet_create',
    WalletImport = 'wallet_import',
    WalletNewSeedCreated = 'wallet_new_seed_created',
    WalletSeedImported = 'wallet_seed_imported',
}

const devKey = keys.MIXPANEL_DEV;
const sandboxKey = keys.MIXPANEL_SANDBOX;
const prodKey = keys.MIXPANEL_PROD;

const holdersStage = keys.MIXPANEL_HOLDERS_STAGE;
const holdersProd = keys.MIXPANEL_HOLDERS_PROD;

function getMixpanelKey(isTestnet?: boolean) {
    return __DEV__ ? devKey : isTestnet ? sandboxKey : prodKey;
}

function getHoldersMixpanelKey(isTestnet?: boolean) {
    return (isTestnet || __DEV__) ? holdersStage : holdersProd;
}

let mixpanelClient = new Mixpanel(getMixpanelKey(IS_SANDBOX));    
mixpanelClient.init();

let holdersMixpanelClient = new Mixpanel(getHoldersMixpanelKey(IS_SANDBOX));
holdersMixpanelClient.init();

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
        mixpanelClient = new Mixpanel(getMixpanelKey(isTestnet));
        mixpanelClient.init();
        if (__DEV__) {
            mixpanelClient.setLoggingEnabled(true);
        }
    }
    return mixpanelClient;
}

export function holdersMixpanelInst(isTestnet?: boolean) {
    if (isTestnet !== IS_SANDBOX) {
        holdersMixpanelClient = new Mixpanel(getHoldersMixpanelKey(isTestnet));
        holdersMixpanelClient.init();
        if (__DEV__) {
            holdersMixpanelClient.setLoggingEnabled(true);
        }
    }
    return holdersMixpanelClient;
}

export function trackEvent(eventName: MixpanelEvent, properties?: MixpanelProperties, isTestnet?: boolean, repeatHolders?: boolean) {
    try {
        mixpanelInst(isTestnet).track(eventName, properties);
        if (repeatHolders) {
            holdersMixpanelInst(isTestnet).track(eventName, properties);
        }
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

export function mixpanelIdentify(wallet: string, isTestnet?: boolean) {
    mixpanelInst(isTestnet).identify(wallet);
    holdersMixpanelInst(isTestnet).getPeople().union('wallets', [wallet]);
}

export function mixpanelAddReferrer(referrer: string, isTestnet?: boolean) {
    mixpanelInst(isTestnet).getPeople().set({ referrer });
    holdersMixpanelInst(isTestnet).getPeople().set({ referrer });
}