import { useMutation } from "@tanstack/react-query";
import { ChangellyEstimateResult, ChangellyLimitError, fetchChangellyEstimate } from "../../api/changelly/fetchChangellyEstimate";

export function useChangellyEstimate() {
    return useMutation<
        ChangellyEstimateResult | undefined,
        Error | ChangellyLimitError,
        { toCurrency: string; fromCurrency: string; amount: string }
    >({
        mutationFn: async ({ toCurrency, fromCurrency, amount }) => {
            return await fetchChangellyEstimate(toCurrency, fromCurrency, amount);
        },
    });
}
