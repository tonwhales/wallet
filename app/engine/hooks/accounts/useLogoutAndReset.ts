import { MixpanelEvent, mixpanelFlush, mixpanelReset, trackEvent } from "../../../analytics/mixpanel";
import { getAppState } from "../../../storage/appState";
import { sharedStoragePersistence, storage, storagePersistence } from "../../../storage/storage";
import { useSetAppState } from "../appstate";
import { useClearHolders } from "../holders";
import { useNetwork } from "../network";

export function useLogoutAndReset() {
    const { isTestnet } = useNetwork();
    const clearHolders = useClearHolders();
    const setAppState = useSetAppState();

    return () => {
        const appState = getAppState();

        mixpanelReset(isTestnet) // Clear super properties and generates a new random distinctId
        trackEvent(MixpanelEvent.Reset, undefined, isTestnet);
        mixpanelFlush(isTestnet);

        if (appState.addresses.length === 1) {
            const selected = appState.addresses[0];

            clearHolders(selected.address.toString({ testOnly: isTestnet }));

            storage.clearAll();
            sharedStoragePersistence.clearAll();
            storagePersistence.clearAll();

            setAppState({ addresses: [], selected: -1 }, isTestnet);
            return;
        }

        const selected = appState.addresses[appState.selected];

        clearHolders(selected.address.toString({ testOnly: isTestnet }));

        const newAddresses = appState.addresses.filter((address) => !address.address.equals(selected.address));

        const newState = {
            addresses: newAddresses,
            selected: 0,
        };

        setAppState(newState, isTestnet);
    }
}