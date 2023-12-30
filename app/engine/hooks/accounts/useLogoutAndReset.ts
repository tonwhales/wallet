import { MixpanelEvent, mixpanelFlush, mixpanelReset, trackEvent } from "../../../analytics/mixpanel";
import { getAppState } from "../../../storage/appState";
import { BiometricsState, PasscodeState } from '../../../storage/secureStorage';
import { sharedStoragePersistence, storage, storagePersistence } from "../../../storage/storage";
import { queryClient } from "../../clients";
import { useSetAppState, useSetBiometricsState, useSetPasscodeState } from "../appstate";
import { useClearHolders } from "../holders";
import { useNetwork } from "../network";

export function useLogoutAndReset() {
    const { isTestnet } = useNetwork();
    const clearHolders = useClearHolders();
    const setAppState = useSetAppState();
    const setBiometricsState = useSetBiometricsState();
    const setPasscodeState = useSetPasscodeState();

    return (full?: boolean) => {
        const appState = getAppState();

        mixpanelReset(isTestnet) // Clear super properties and generates a new random distinctId
        trackEvent(MixpanelEvent.Reset, undefined, isTestnet);
        mixpanelFlush(isTestnet);

        if (full) {
            storage.clearAll();
            sharedStoragePersistence.clearAll();
            storagePersistence.clearAll();
            queryClient.cancelQueries();

            setAppState({ addresses: [], selected: -1 }, isTestnet);
            setBiometricsState(BiometricsState.NotSet);
            setPasscodeState(PasscodeState.NotSet);
            return;
        }

        if (appState.addresses.length === 1) {
            const selected = appState.addresses[0];

            clearHolders(selected.address.toString({ testOnly: isTestnet }));

            storage.clearAll();
            sharedStoragePersistence.clearAll();
            storagePersistence.clearAll();

            setAppState({ addresses: [], selected: -1 }, isTestnet);
            setBiometricsState(BiometricsState.NotSet);
            setPasscodeState(PasscodeState.NotSet);
            return;
        }

        const selected = appState.addresses[appState.selected];
        const newAddresses = appState.addresses.filter((address) => !address.address.equals(selected.address));
        const newState = { addresses: newAddresses, selected: 0 };

        clearHolders(selected.address.toString({ testOnly: isTestnet }));

        setAppState(newState, isTestnet);
    }
}