import { useHintsFull, useNetwork } from "..";
import { getSpecialJetton, savingsMasters } from "../../../secure/KnownWallets";

export function useDisplayableJettons(addressString?: string) {
    const { isTestnet } = useNetwork();
    const hints = useHintsFull(addressString).data?.hints ?? [];

    const savings = hints.filter(hint => hint.jetton.address in savingsMasters);
    const jettonsList = hints.filter(hint => {
        return !(hint.jetton.address in savingsMasters)
            && hint.jetton.address !== getSpecialJetton(isTestnet);
    });

    return { savings, jettonsList };
}