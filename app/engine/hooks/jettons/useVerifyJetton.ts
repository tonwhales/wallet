import { useKnownJettons } from ".";
import { useNetwork } from "../network";
import { getKnownJettons } from "./useKnownJettons";

export function useVerifyJetton({ ticker, master }: { ticker?: string | null, master?: string | null }) {
    const { isTestnet } = useNetwork();
    const knownJettons = useKnownJettons(isTestnet);

    if (!ticker && !master) {
        return { verified: false, isSCAM: false };
    }

    const knownMasters = knownJettons?.masters ?? {};
    const knownTickers = knownJettons?.tickers ?? [];

    const isMasterVerified = master ? !!knownMasters[master] : false;
    const isKnownTicker = !!ticker && knownTickers.includes(ticker);
    const isSCAM = isKnownTicker ? !isMasterVerified : false;

    return {
        verified: isMasterVerified,
        isSCAM: isSCAM
    };
}

export function verifyJetton({ ticker, master }: { ticker?: string | null, master?: string | null }, isTestnet: boolean) {
    const knownJettons = getKnownJettons(isTestnet);
    if (!ticker && !master) {
        return { verified: false, isSCAM: false };
    }

    const knownMasters = knownJettons?.masters ?? {};
    const knownTickers = knownJettons?.tickers ?? [];

    const isMasterVerified = master ? !!knownMasters[master] : false;
    const isKnownTicker = !!ticker && knownTickers.includes(ticker);
    const isSCAM = isKnownTicker ? !isMasterVerified : false;

    return {
        verified: isMasterVerified,
        isSCAM: isSCAM
    };
}