import { Linking, Platform } from "react-native";
import * as Notifications from 'expo-notifications';
import { z } from 'zod';
import branch, { BranchParams } from 'react-native-branch'
import { sharedStoragePersistence } from "../storage/storage";
import appsFlyer, { InitSDKOptions } from 'react-native-appsflyer';

let lastLink: string | null = null;
let listener: (((link: string) => void) | null) = null;

function handleLinkReceived(link: string) {
    if (listener) {
        listener(link);
    } else {
        lastLink = link;
    }
}

function checkForBranchCampaignId(uri: string) {
    try {
        const url = new URL(uri);
        const campaignId = url.searchParams.get('campaignId')
        if (campaignId) {
            storeCampaignId(campaignId);
        }
    } catch { }
}

// Fetch initial
(async () => {
    let url = await Linking.getInitialURL();
    if (url) {
        checkForBranchCampaignId(url);
        handleLinkReceived(url);
    }
})();

type TrimmedBranchParams = Omit<BranchParams, '+clicked_branch_link' | '~referring_link'>;

const branchCampaignKey = 'branch-campaign';

export function getCampaignId(): string | undefined {
    return sharedStoragePersistence.getString(branchCampaignKey);
}

export function storeCampaignId(campaignId: string) {
    sharedStoragePersistence.set(branchCampaignKey, campaignId);
}

// TODO: remove before going to production
const lastAttributionKey = 'last-attribution';

export function getLastAttribution(): string | undefined {
    return sharedStoragePersistence.getString(lastAttributionKey);
}

export function storeLastAttribution(attribution: string) {
    sharedStoragePersistence.set(lastAttributionKey, attribution);
}

function handleAttribution(deepLink: string, params?: TrimmedBranchParams) {
    storeLastAttribution(deepLink);
    const uri = `https://tonhub.com/${deepLink}`;
    const url = new URL(uri);

    const campaignId = url.searchParams.get('campaignId');

    if (campaignId) {
        storeCampaignId(campaignId);
    }

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (key === '$deeplink_path') {
                continue;
            }
            url.searchParams.append(key, value as string);
        }
    }

    handleLinkReceived(url.toString());
}

function handleBranchLink(params: TrimmedBranchParams) {
    const deepLink = params.$deeplink_path as string;

    if (deepLink) {
        handleAttribution(deepLink, params);
    }
}

// Listener
branch.subscribe({
    onOpenComplete: ({
        error,
        params,
        uri
    }) => {
        if (error) {
            return;
        }

        if (params) {
            if (uri) {
                checkForBranchCampaignId(uri);
            }
            if (params['+clicked_branch_link']) {
                // Routing with Branch link data 
                let passingParams = params as Partial<BranchParams>;
                delete passingParams['+clicked_branch_link'];
                delete passingParams['~referring_link'];

                handleBranchLink(passingParams);
                return;
            }

            if (uri) {
                handleLinkReceived(uri);
            }
        }
    }
});

appsFlyer.onDeepLink(res => {
    if (res.data && res.data.deep_link_value) {
        handleAttribution(res.data.deep_link_value);
    }
});

const appsFlyerConfig: InitSDKOptions = {
    devKey: 'appsflyer_key',
    isDebug: false,
    appId: '1607656232',
    onInstallConversionDataListener: true, //Optional
    onDeepLinkListener: true, //Optional
    timeToWaitForATTUserAuthorization: 15 //for iOS 14.5
};

appsFlyer.initSdk(
    appsFlyerConfig,
    (result) => console.log('AppsFlyer', result),
    (error) => console.log('AppsFlyer', error)
);

// Subscribe for links
Linking.addEventListener('url', (e) => {
    checkForBranchCampaignId(e.url);
    handleLinkReceived(e.url);
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
    setListener: (handler: (link: string) => void) => {
        if (listener) {
            throw Error('Listener already set');
        }
        listener = handler;
        if (lastLink) {
            let l = lastLink;
            lastLink = null;
            handler(l);
        }
        return () => {
            if (listener !== handler) {
                throw Error('Internal error');
            }
            listener = null;
        };
    }
};