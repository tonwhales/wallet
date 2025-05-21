import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { KnownJettons, fetchKnownJettons } from "../../api/fetchKnownJettons";
import { KnownJettonMastersMainnet, KnownJettonMastersTestnet, KnownJettonTickers, SpecialJettonMainnet, SpecialJettonTestnet } from "../../../secure/KnownWallets";
import { queryClient } from "../../clients";
import { getQueryData } from "../../utils/getQueryData";
import { useEthena } from "..";
import { t } from "../../../i18n/t";

export function useKnownJettons(isTestnet: boolean): KnownJettons | null {
    const full = useQuery({
        queryKey: Queries.Jettons().Known(),
        queryFn: fetchKnownJettons,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    }).data ?? null;
    const { minter, tsMinter } = useEthena();

    const knownJettons = (isTestnet ? full?.testnet : full?.mainnet) ?? null

    let builtInMasters = isTestnet ? KnownJettonMastersTestnet : KnownJettonMastersMainnet;

    const ethenaMasters = {
        [minter.toString({ testOnly: isTestnet })]: { description: t('savings.general', { symbol: 'USDe' }) },
        [tsMinter.toString({ testOnly: isTestnet })]: { description: t('savings.general', { symbol: 'tsUSDe' }) }
    }

    builtInMasters = { ...builtInMasters, ...ethenaMasters };

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

export function getKnownJettons(isTestnet: boolean) {
    const cache = queryClient.getQueryCache();
    const full = getQueryData<
        {
            mainnet: {
                tickers: string[];
                masters: Record<string, {}>;
                specialJetton?: string | null | undefined;
            };
            testnet: {
                tickers: string[];
                masters: Record<string, {}>;
                specialJetton?: string | null | undefined;
            };
        } | null
    >(cache, Queries.Jettons().Known());

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