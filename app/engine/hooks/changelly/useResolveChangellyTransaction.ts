import { useMutation } from "@tanstack/react-query";
import { resolveChangellyTransaction } from "../../api/changelly/resolveChangellyTransaction";
import { useCurrentAddress } from "../appstate";
import { useToaster } from "../../../components/toast/ToastProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Currency } from "../../types/deposit";
import { queryClient } from "../../clients";
import { Queries } from "../../queries";

export function useResolveChangellyTransaction() {
    const { tonAddressString, solanaAddress } = useCurrentAddress();
    const toaster = useToaster();
    const insets = useSafeAreaInsets();
    
    return useMutation<
        void,
        Error,
        { transactionId: string; toCurrency: string }
    >({
        mutationFn: async (data) => {
            const walletAddress = (data.toCurrency === Currency.Sol || data.toCurrency === Currency.UsdcSol)
                ? solanaAddress
                : tonAddressString
            return await resolveChangellyTransaction({
                wallet: walletAddress!,
                transactionId: data.transactionId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: Queries.Changelly(tonAddressString!).Transactions(),
            })
        },
        onError: (error) => {
            toaster.show({
                type: 'error',
                message: error.message,
                marginBottom: insets.bottom + 88,
            });
        },
    });
}
