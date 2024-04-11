import { useNetwork } from "../network";
import { useKnownJettonMasters } from "./useKnownJettonMasters";
import { useKnownJettonTickers } from "./useKnownJettonTickers";

export function useIsScamJetton(ticker?: string | null, master?: string | null) {
    const { isTestnet } = useNetwork();
    const knownTickers = useKnownJettonTickers();
    const knownMasters = useKnownJettonMasters(isTestnet);

    if (!ticker || !master) {
        return false;
    }

    const verified = !!knownMasters[master];

    return knownTickers.includes(ticker) && !verified;
}