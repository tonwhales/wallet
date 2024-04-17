import { useJettonsConfig } from ".";
import { useNetwork } from "../network";

export function useIsScamJetton(ticker?: string | null, master?: string | null) {
    const { isTestnet } = useNetwork();
    const config = useJettonsConfig(isTestnet);
    const knownTickers = config?.tickers ?? [];
    const knownMasters = config?.masters ?? {};

    if (!ticker || !master) {
        return false;
    }

    const verified = !!knownMasters[master];

    return knownTickers.includes(ticker) && !verified;
}