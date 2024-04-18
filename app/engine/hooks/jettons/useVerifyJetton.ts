import { useKnownJettons } from ".";
import { KnownJettonMastersMainnet, KnownJettonMastersTestnet, KnownJettonTickers } from "../../../secure/KnownWallets";
import { useNetwork } from "../network";

export function useVerifyJetton({ ticker, master }: { ticker?: string | null, master?: string | null }) {
    const { isTestnet } = useNetwork();
    const knownJettons = useKnownJettons(isTestnet);

    if (!ticker && !master) {
        return { verified: false, isSCAM: false };
    }

    const builtInMasters = isTestnet ? KnownJettonMastersTestnet : KnownJettonMastersMainnet;
    const masters = knownJettons?.masters ?? {};

    // Merge built-in masters with fetched masters (built-in masters have higher priority)
    const knownMasters = { ...builtInMasters, ...masters };
    const knownTickers = [KnownJettonTickers, ...(knownJettons?.tickers ?? [])];

    const isMasterVerified = master ? !!knownMasters[master] : false;
    const isKnownTicker = !!ticker && knownTickers.includes(ticker);
    const isSCAM = isKnownTicker ? !isMasterVerified : false;

    return {
        verified: isMasterVerified,
        isSCAM: isSCAM
    };
}