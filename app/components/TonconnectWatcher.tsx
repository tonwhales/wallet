import { useTonconnectWatcher } from "../engine/useTonconnectWatcher";

export const TonconnectWatcher = () => {
    // Watch for TonConnect requests
    useTonconnectWatcher();
    return null;
}