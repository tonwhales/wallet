import { useHintsFull, useNetwork } from "..";
import { getSpecialJetton, useSavingsMasters } from "../../../secure/KnownWallets";

export function useDisplayableJettons(addressString?: string) {
    const { isTestnet } = useNetwork();
    const hints = useHintsFull(addressString).data?.hints ?? [];
    const savingsMasters = useSavingsMasters();

    const savings = hints
        .filter(hint => hint.jetton.address in savingsMasters)
        .map(hint => ({ ...hint, description: savingsMasters[hint.jetton.address].description }));

    const jettonsList = hints.filter(hint => {
        return !(hint.jetton.address in savingsMasters)
            && hint.jetton.address !== getSpecialJetton(isTestnet);
    });

    return { savings, jettonsList };
}