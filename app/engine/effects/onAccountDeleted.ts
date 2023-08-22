import { MixpanelEvent, mixpanelFlush, mixpanelReset, trackEvent } from '../../analytics/mixpanel';
import { storage } from '../../storage/storage';

export function onAccountDeleted(isTestnet: boolean) {
    storage.clearAll();
    mixpanelReset(isTestnet); // Clear super properties and generates a new random distinctId
    trackEvent(MixpanelEvent.Reset, undefined, isTestnet);
    mixpanelFlush(isTestnet);
    // reboot();
}