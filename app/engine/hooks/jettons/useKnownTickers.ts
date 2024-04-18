import { useKnownJettons } from ".";
import { KnownJettonTickers } from "../../../secure/KnownWallets";

export function useKnownTickers(isTestnet: boolean) {
    const knowJettons = useKnownJettons(isTestnet);
    return [KnownJettonTickers, ...(knowJettons?.tickers ?? [])];
}