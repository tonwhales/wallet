import { Linking } from "react-native";
import * as Notifications from 'expo-notifications';
import { z } from 'zod';
import branch from 'react-native-branch'

let lastLink: string | null = null;
let listener: (((link: string) => void) | null) = null;

function handleLinkReceived(link: string) {
    if (listener) {
        listener(link);
    } else {
        lastLink = link;
    }
}

// Fetch initial
(async () => {
    let url = await Linking.getInitialURL();
    if (url) {
        handleLinkReceived(url);
    }
})();

// Listener
branch.subscribe({
    onOpenStart: ({
        uri,
        cachedInitialEvent
    }) => {
        console.log(
            'subscribe onOpenStart, will open ' +
            uri +
            ' cachedInitialEvent is ' +
            cachedInitialEvent,
        );
    },
    onOpenComplete: ({
        error,
        params,
        uri
    }) => {
        if (error) {
            console.error(
                'subscribe onOpenComplete, Error from opening uri: ' +
                uri +
                ' error: ' +
                error,
            );
            return;
        }
        else if (params) {
            if (!params['+clicked_branch_link']) {
                if (params['+non_branch_link']) {
                    console.log('non_branch_link: ' + uri);
                    // Route based on non-Branch links
                    return;
                }
            } else {
                // Handle params
                let deepLinkPath = params.$deeplink_path as string; 
                let canonicalUrl = params.$canonical_url as string;
                // Route based on Branch link data 
                return
            }
        }
    },
});

(async () => {
    try {
        let latestParams = await branch.getLatestReferringParams() // Params from last open
        console.log('latestParams', latestParams)
    } catch (error) {
        console.error('getLatestReferringParams error')
    }
})();


// Subscribe for links
Linking.addEventListener('url', (e) => {
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

// Handle push notifications
Notifications.addNotificationResponseReceivedListener((response) => {
    let data = response.notification.request.content.data;
    if (data && typeof data['url'] === 'string') {
        handleLinkReceived(data['url']);
    } else if (data && typeof data['type'] === 'string' && data['type'].toLowerCase().includes('holders-push')) {
        handleHoldersData(data);
    }
});

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