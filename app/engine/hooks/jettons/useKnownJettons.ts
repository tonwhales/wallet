import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { KnownJettons, fetchKnownJettons } from "../../api/fetchKnownJettons";
import { KnownJettonMastersMainnet, KnownJettonMastersTestnet, KnownJettonTickers, SpecialJettonMainnet, SpecialJettonTestnet } from "../../../secure/KnownWallets";

export function useKnownJettons(isTestnet: boolean): KnownJettons | null {
    const full = useQuery({
        queryKey: Queries.Jettons().Known(),
        queryFn: fetchKnownJettons,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    }).data ?? null;

    const knownJettons = (isTestnet ? full?.testnet : full?.mainnet) ?? null

    const builtInMasters = isTestnet ? KnownJettonMastersTestnet : KnownJettonMastersMainnet;
    const builtInSpecialJetton = isTestnet ? SpecialJettonTestnet : SpecialJettonMainnet;
    const builtInTickers = KnownJettonTickers;

    // Merge built-in data with fetched (built-in data has higher priority)
    const specialJetton = builtInSpecialJetton ?? knownJettons?.specialJetton;
    const masters = { ...builtInMasters, ...(knownJettons?.masters ?? {}) };
    const tickers = [...new Set([...builtInTickers, ...(knownJettons?.tickers ?? [])])];

    return {
        tickers,
        specialJetton,
        masters
    }
}