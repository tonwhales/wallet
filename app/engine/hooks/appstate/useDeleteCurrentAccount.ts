import { mixpanelFlush, mixpanelReset } from "../../../analytics/mixpanel";
import { useWebViewPreloader } from "../../../components/WebViewPreloaderContext";
import { getAppState } from "../../../storage/appState";
import { BiometricsState, PasscodeState } from '../../../storage/secureStorage';
import { storage, storagePersistence } from "../../../storage/storage";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { queryClient } from "../../clients";
import { clearDomainKeysState } from "../../state/domainKeys";
import { deleteHoldersToken } from "../../../storage/holders";
import { useNetwork } from "../network";
import { useSetAppState } from "./useSetAppState";
import { useSetBiometricsState } from './useSetBiometricsState';
import { useSetPasscodeState } from './useSetPasscodeState';
import { NativeModules, Platform } from "react-native";
import { useLedgerTransport } from "../../../fragments/ledger/components/TransportContext";

const { WebViewCacheModule } = NativeModules;

export function useDeleteCurrentAccount() {
    const { isTestnet } = useNetwork();
    const setAppState = useSetAppState();
    const setBiometricsState = useSetBiometricsState();
    const setPasscodeState = useSetPasscodeState();
    const { clearWebViewLocalStorage } = useWebViewPreloader();
    const ledgerContext = useLedgerTransport();

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
            if (Platform.OS === 'android') {
                WebViewCacheModule.clearCache();
            }

            // Reset biometrics state to defaults
            setAppState({ addresses: [], selected: -1 }, isTestnet);
            setPasscodeState(PasscodeState.NotSet);
            setBiometricsState(BiometricsState.NotSet);
            ledgerContext.reset({ isFullSilentLogout: true });
            clearWebViewLocalStorage();

            navigation.navigateAndReplaceAll('Welcome');
        }
    }
}