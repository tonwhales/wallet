import { useKnownJettons } from ".";
import { useEthena } from "..";
import { t } from "../../../i18n/t";
import { KnownJettonMastersMainnet, KnownJettonMastersTestnet } from "../../../secure/KnownWallets";

export function useKnownJettonsMasters(isTestnet: boolean) {
    const knownJettons = useKnownJettons(isTestnet);
    const { minter, tsMinter } = useEthena();
    const masters = knownJettons?.masters ?? {};
    const builtInMasters = isTestnet ? KnownJettonMastersTestnet : KnownJettonMastersMainnet;

    const ethenaMasters = {
        [minter.toString({ testOnly: isTestnet })]: { description: t('savings.general', { symbol: 'USDe' }) },
        [tsMinter.toString({ testOnly: isTestnet })]: { description: t('savings.general', { symbol: 'tsUSDe' }) }
    }

    // Merge built-in masters with fetched masters (built-in masters have higher priority)
    return { ...builtInMasters, ...ethenaMasters, ...masters };
}