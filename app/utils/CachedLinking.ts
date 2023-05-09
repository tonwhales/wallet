import { Linking } from "react-native";
import * as Notifications from 'expo-notifications';
import { MixpanelEvent, trackEvent } from "../analytics/mixpanel";
import { initialAppConfig } from "./AppConfigContext";

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

// Subscribe for links
Linking.addEventListener('url', (e) => {
    trackEvent(MixpanelEvent.LinkReceived, { url: e.url }, initialAppConfig.isTestnet);
    handleLinkReceived(e.url);
});

// Handle push notifications
Notifications.addNotificationResponseReceivedListener((response) => {
    let data = response.notification.request.content.data;
    if (data && typeof data['url'] === 'string') {
        trackEvent(MixpanelEvent.NotificationReceived, { url: data['url'] }, initialAppConfig.isTestnet);
        handleLinkReceived(data['url']);
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