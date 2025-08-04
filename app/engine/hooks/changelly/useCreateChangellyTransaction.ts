import { useMutation } from "@tanstack/react-query";
import { createChangellyTransaction, CreateChangellyTransactionBody } from "../../api/changelly/createChangellyTransaction";
import { useCurrentAddress } from "../appstate";
import { getRandomQueryId } from "../../../utils/staking/createWithdrawStakeCommand";
import { Currency } from "../../types/deposit";
import { useToaster } from "../../../components/toast/ToastProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchChangellyTransactionDetails } from "../../api/changelly/fetchChangellyTransactionDetails";
import { ChangellyTransactionModel } from "../../api/changelly";
import { Queries } from "../../queries";
import { queryClient } from "../../clients";

export function useCreateChangellyTransaction() {
    const { tonAddressString, solanaAddress } = useCurrentAddress();
    const toaster = useToaster();
    const insets = useSafeAreaInsets();
    
    return useMutation<
        ChangellyTransactionModel,
        Error,
        Omit<CreateChangellyTransactionBody, 'wallet' | 'idempotencyKey'>
    >({
        mutationFn: async (data) => {
            const walletAddress = (data.toCurrency === Currency.Sol || data.toCurrency === Currency.UsdcSol)
                ? solanaAddress
                : tonAddressString
            const transaction = await createChangellyTransaction({
                ...data,
                idempotencyKey: getRandomQueryId().toString(),
                wallet: walletAddress!
            });
            return await fetchChangellyTransactionDetails({
                transactionId: transaction.id
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
