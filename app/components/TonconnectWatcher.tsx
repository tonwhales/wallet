import { useTonconnectWatcher } from "../engine/tonconnectWatcher";

export const TonconnectWatcher = () => {
    // Watch for TonConnect requests
    useTonconnectWatcher();
    return null;
}