import { Linking } from "react-native";
import * as Notifications from 'expo-notifications';
import { z } from 'zod';
import branch, { BranchParams } from 'react-native-branch'
import { sharedStoragePersistence } from "../storage/storage";

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
    } catch {}
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

function handleBranchLink(params: TrimmedBranchParams) {
    const deepLink = params.$deeplink_path as string;

    if (deepLink) {
        const uri = `https://tonhub.com/${deepLink}`;
        const url = new URL(uri);

        const campaignId = url.searchParams.get('campaignId');

        if (campaignId) {
            storeCampaignId(campaignId);
        }

        // append params as query
        for (const [key, value] of Object.entries(params)) {
            if (key === '$deeplink_path') {
                continue;
            }
            url.searchParams.append(key, value as string);
        }
        handleLinkReceived(url.toString());
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
            if (!params['+clicked_branch_link']) {
                // this will be handled in Linking.getInitialURL
                return;
            }
            // Routing with Branch link data 
            let passingParams = params as Partial<BranchParams>;
            delete passingParams['+clicked_branch_link'];
            delete passingParams['~referring_link'];

            handleBranchLink(passingParams);
            return;
        }
    },

});

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