import { mixpanelFlush, mixpanelReset } from "../../../analytics/mixpanel";
import { getAppState } from "../../../storage/appState";
import { storage, storagePersistence } from "../../../storage/storage";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { queryClient } from "../../clients";
import { clearDomainKeysState } from "../../state/domainKeys";
import { deleteHoldersToken } from "../holders/useHoldersAccountStatus";
import { useNetwork } from "../network";
import { useSetAppState } from "./useSetAppState";

export function useDeleteCurrentAccount() {
    const { isTestnet } = useNetwork();
    const setAppState = useSetAppState();
    const navigation = useTypedNavigation();
    return () => {
        const appState = getAppState();

        if (appState.selected === -1) {
            return;
        }

        const selected = appState.addresses[appState.selected];

        // Cancel all running queries
        queryClient.cancelQueries();
        // Clear query cache for the current account
        queryClient.invalidateQueries({ queryKey: ['account', selected.address.toString({ testOnly: isTestnet })] });
        queryClient.invalidateQueries({ queryKey: ['holders', selected.address.toString({ testOnly: isTestnet })] });

        
        mixpanelReset(isTestnet);
        mixpanelFlush(isTestnet);
        
        
        if (appState.addresses.length > 1) {
            deleteHoldersToken(selected.address.toString({ testOnly: isTestnet }));
            clearDomainKeysState(selected.address);
            const addresses = appState.addresses.filter((v, i) => i !== appState.selected);
            setAppState({
                addresses,
                selected: 0
            }, isTestnet);
            navigation.navigateAndReplaceAll('Home');
        } else {
            // clear all storage including app key and go to welcome screen
            storagePersistence.clearAll();
            storage.clearAll();
            setAppState({ addresses: [], selected: -1 }, isTestnet);
            navigation.navigateAndReplaceAll('Welcome');
        }
    }
}