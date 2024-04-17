import { useQuery } from "@tanstack/react-query";
import { Queries } from "../../queries";
import { fetchKnownJettonTickers } from "../../api/fetchKnownJettonTickers";
import { KnownJettonTickers } from "../../../secure/KnownWallets";

export function useKnownJettonTickers() {
    const tickers = useQuery({
        queryKey: Queries.Jettons().Tickers(),
        queryFn: fetchKnownJettonTickers,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });

    return [...KnownJettonTickers, ...(tickers.data ?? [])]
}