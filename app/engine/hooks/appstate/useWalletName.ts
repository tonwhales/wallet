import { useAppState, useWalletSettings } from "..";
import { t } from "../../../i18n/t";

export const useWalletName = () => {
    const appState = useAppState();
    const address = appState.addresses[appState.selected]?.address;
    const [walletSettings] = useWalletSettings(address);
    
    const walletName = walletSettings?.name || `${t('common.wallet')} ${appState.selected + 1}`;
    const shortWalletName = walletName.length > 9 ? `${walletName.slice(0, 4)}...${walletName.slice(walletName.length - 4)}` : walletName;
    
    return { walletName, shortWalletName };
}