import { useKnownJettons } from ".";
import { KnownJettonMastersMainnet, KnownJettonMastersTestnet } from "../../../secure/KnownWallets";

export function useKnownJettonsMasters(isTestnet: boolean) {
    const knownJettons = useKnownJettons(isTestnet);
    const masters = knownJettons?.masters ?? {};
    const builtInMasters = isTestnet ? KnownJettonMastersTestnet : KnownJettonMastersMainnet;

    // Merge built-in masters with fetched masters (built-in masters have higher priority)
    return { ...builtInMasters, ...masters };
}