import { Linking, Platform, NativeModules } from "react-native";
import * as Notifications from 'expo-notifications';
import { z } from 'zod';
import { resolveSearchParams } from "./holders/resolveSearchParams";
import { processSearchParams } from "./holders/queryParamsStore";
import { isMaestraPushDataIOS } from "../engine/types";
import { afLog } from "../analytics/appsFlyerDebugLog";

const { MaestraModule } = NativeModules;

let lastLink: string | null = null;
let listener: (((link: string) => string | null) | null) = null;

export function handleLinkReceived(link: string) {
    afLog('LINK', `handleLinkReceived: listener=${!!listener}`, { link });
    if (listener) {
        lastLink = listener(link);
        afLog('LINK', `listener returned lastLink=${lastLink}`);
    } else {
        lastLink = link;
        afLog('LINK', `No listener, cached lastLink=${lastLink}`);
    }
}

function resolveAndProcessLink(link: string) {
    afLog('LINK', `resolveAndProcessLink`, { link });
    const params = resolveSearchParams(link);
    afLog('LINK', `resolvedSearchParams`, params);
    processSearchParams(params);
    handleLinkReceived(link);
}

// Fetch initial
(async () => {
    let url = await Linking.getInitialURL();
    afLog('LINK', `getInitialURL = ${url}`);
    if (url) {
        resolveAndProcessLink(url);
    }
})();

export function handleAttribution(deepLink: string) {
    const uri = `https://tonhub.com/${deepLink}`;
    afLog('LINK', `handleAttribution: deepLink=${deepLink}, uri=${uri}`);
    resolveAndProcessLink(uri);
}


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

    if (Platform.OS === 'ios' && MaestraModule) {
        const payload = (response.notification.request.trigger as Notifications.PushNotificationTrigger).payload;
        if (payload) {
            if (isMaestraPushDataIOS(payload)) {
                MaestraModule.trackPushClick(payload, response.actionIdentifier);
                handleLinkReceived(payload.clickUrl);
            }
        }
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
        afLog('LINK', `setListener called, lastLink=${lastLink}`);
        if (listener) {
            throw Error('Listener already set');
        }
        listener = handler;
        if (lastLink) {
            let l = lastLink;
            afLog('LINK', `setListener: processing cached lastLink=${l}`);
            lastLink = handler(l);
            afLog('LINK', `setListener: after handler, lastLink=${lastLink}`);
        }
        return () => {
            if (listener !== handler) {
                throw Error('Internal error');
            }
            listener = null;
        };
    },
    openLastLink: () => {
        afLog('LINK', `openLastLink called, lastLink=${lastLink}, listener=${!!listener}`);
        if (lastLink && listener) {
            lastLink = listener(lastLink);
            afLog('LINK', `openLastLink: after handler, lastLink=${lastLink}`);
        }
    },
    getLastLink: () => lastLink
};