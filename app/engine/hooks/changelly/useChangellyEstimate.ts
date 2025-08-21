import { useMutation } from "@tanstack/react-query";
import { ChangellyEstimateResult, fetchChangellyEstimate } from "../../api/changelly/fetchChangellyEstimate";

export function useChangellyEstimate() {
    return useMutation<
        ChangellyEstimateResult | undefined,
        Error,
        { toCurrency: string; fromCurrency: string; amount: string }
    >({
        mutationFn: async ({ toCurrency, fromCurrency, amount }) => {
            return await fetchChangellyEstimate(toCurrency, fromCurrency, amount);
        },
    });
}
