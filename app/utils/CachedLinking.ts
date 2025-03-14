import { Linking, Platform } from "react-native";
import * as Notifications from 'expo-notifications';
import { z } from 'zod';
import appsFlyer, { InitSDKOptions } from 'react-native-appsflyer';
import { resolveSearchParams } from "./holders/resolveSearchParams";
import { processSearchParams } from "./holders/queryParamsStore";

let lastLink: string | null = null;
let listener: (((link: string) => string | null) | null) = null;

export function handleLinkReceived(link: string) {
    if (listener) {
        lastLink = listener(link);
    } else {
        lastLink = link;
    }
}

function resolveAndProcessLink(link: string) {
    const params = resolveSearchParams(link);
    processSearchParams(params);
    handleLinkReceived(link);
}

// Fetch initial
(async () => {
    let url = await Linking.getInitialURL();
    if (url) {
        resolveAndProcessLink(url);
    }
})();

function handleAttribution(deepLink: string) {
    const uri = `https://tonhub.com/${deepLink}`;
    resolveAndProcessLink(uri);
}

appsFlyer.onDeepLink(res => {
    if (res.data && res.data.deep_link_value) {
        handleAttribution(res.data.deep_link_value);
    }
});

const keys = require('@assets/keys.json');

export const appsFlyerConfig: InitSDKOptions = {
    devKey: keys.APPSFLYER_KEY,
    isDebug: false,
    appId: '1607656232',
    onInstallConversionDataListener: true, //Optional
    onDeepLinkListener: true, //Optional
    timeToWaitForATTUserAuthorization: 15 //for iOS 14.5
};

appsFlyer.initSdk(appsFlyerConfig);

// Subscribe for links
Linking.addEventListener('url', (e) => {
    resolveAndProcessLink(e.url);
});

const holdersPushDataSchema = z.object({
    type: z.literal('holders-push'),
    accountId: z.string(),
    addresses: z.array(z.string()),
    eventId: z.string().optional(),
    cardId: z.string().optional()
});

function handleHoldersData(data: object | null | undefined) {
    const parsed = holdersPushDataSchema.safeParse(data);

    if (!parsed.success) {
        return;
    }

    const urlBase = 'https://tonhub.com/holders/transactions';
    const url = new URL(urlBase);

    url.searchParams.append('accountId', parsed.data.accountId);
    url.searchParams.append('addresses', parsed.data.addresses.join(','));

    if (parsed.data.cardId) {
        url.searchParams.append('cardId', parsed.data.cardId);
    }

    if (parsed.data.eventId) {
        url.searchParams.append('transactionId', parsed.data.eventId);
    }

    handleLinkReceived(url.toString());
}

function handleNotificationResponse(response: Notifications.NotificationResponse | null) {
    if (!response) {
        return;
    }
    let data = response.notification.request.content.data;
    if (data && typeof data['url'] === 'string') {
        handleLinkReceived(data['url']);
    } else if (data && typeof data['type'] === 'string' && data['type'].toLowerCase().includes('holders-push')) {
        handleHoldersData(data);
    }
}

// Handle push notifications
Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

// Handle app opened from notification for Android
if (Platform.OS === 'android') {
    Notifications.getLastNotificationResponseAsync().then(handleNotificationResponse);
}

export const CachedLinking = {
    setListener: (handler: (link: string) => string | null) => {
        if (listener) {
            throw Error('Listener already set');
        }
        listener = handler;
        if (lastLink) {
            let l = lastLink;
            lastLink = handler(l);
        }
        return () => {
            if (listener !== handler) {
                throw Error('Internal error');
            }
            listener = null;
        };
    },
    openLastLink: () => {
        if (lastLink && listener) {
            lastLink = listener(lastLink);
        }
    },
    getLastLink: () => lastLink
};