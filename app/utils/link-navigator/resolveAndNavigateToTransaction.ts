import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { SelectedAccount, TonStoredTransaction, TonTransaction, TransactionType } from "../../engine/types";
import { TypedNavigation } from "../useTypedNavigation";
import { AppState, getAppState } from "../../storage/appState";
import { Address } from "@ton/core";
import { Queries } from "../../engine/queries";
import { getQueryData } from "../../engine/utils/getQueryData";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { fetchAccountTransactions } from "../../engine/api/fetchAccountTransactions";
import { createBackoff } from "../time";

const infoBackoff = createBackoff({ maxFailureCount: 10 });

export async function resolveAndNavigateToTransaction(
    params: {
        resolved: {
            type: 'tx',
            address: string,
            hash: string,
            lt: string
        },
        isTestnet: boolean,
        selected: SelectedAccount,
        queryClient: ReturnType<typeof useQueryClient>,
        loader: { show: () => () => void },
        navigation: TypedNavigation,
        updateAppState: (value: AppState, isTestnet: boolean) => void
    }
) {
    const { resolved, isTestnet, selected, queryClient, loader, navigation, updateAppState } = params;
    const hideloader = loader.show();

    let lt = resolved.lt;
    let hash = resolved.hash;

    try {
        if (selected && !!selected.addressString) {
            const isSelectedAddress = selected.address.equals(Address.parse(resolved.address));
            const queryCache = queryClient.getQueryCache();
            const holdersStatusKey = Queries.Holders(resolved.address).Status();
            const holdersStatusData = getQueryData<HoldersAccountStatus>(queryCache, holdersStatusKey);

            const token = (
                !!holdersStatusData &&
                holdersStatusData.state === HoldersUserState.Ok
            ) ? holdersStatusData.token : null;

            let txsV2 = getQueryData<InfiniteData<TonStoredTransaction[]>>(queryCache, Queries.TransactionsV2(resolved.address, !!token));
            let transaction = txsV2?.pages?.flat()?.find(tx => tx.type === TransactionType.TON && (tx.data.lt === lt && tx.data.hash === hash))?.data as TonTransaction | undefined

            if (!transaction) {
                await queryClient.invalidateQueries({
                    queryKey: Queries.TransactionsV2(resolved.address, !!token),
                    refetchPage: (last, index, allPages) => index == 0,
                });

                txsV2 = getQueryData<InfiniteData<TonStoredTransaction[]>>(queryCache, Queries.TransactionsV2(resolved.address, !!token));
                transaction = txsV2?.pages?.flat()?.find(tx => tx.type === TransactionType.TON && (tx.data.lt === lt && tx.data.hash === hash))?.data as TonTransaction | undefined;
            }

            // If transaction is not found in the list, fetch it from the server
            if (!transaction) {
                // Try to fetch transaction from the server
                const rawTxs = await infoBackoff('tx', async () => await fetchAccountTransactions(resolved.address, isTestnet, { lt, hash }));
                if (rawTxs.length > 0 && !!rawTxs[0]) {
                    const base = rawTxs[0];
                    transaction = {
                        id: `${base.lt}_${base.hash}`,
                        base: base,
                        outMessagesCount: base.outMessagesCount,
                        outMessages: base.outMessages,
                        lt: base.lt,
                        hash: base.hash
                    };
                }
            }

            if (!!transaction) {
                // If transaction is for the selected address, navigate to it
                if (isSelectedAddress) {
                    navigation.navigateTonTransaction(transaction);
                } else { // If transaction is for another address, navigate to the address first
                    const appState = getAppState();
                    const address = Address.parse(resolved.address);
                    const index = appState.addresses.findIndex((a) => a.address.equals(address));

                    // If address is found, select it
                    if (index !== -1) {
                        // Select new address
                        updateAppState({ ...appState, selected: index }, isTestnet);

                        // await 1 second in case of app state is not updated yet (should never happen)
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // navigate to home with tx to be opened after
                        navigation.navigateAndReplaceHome({ navigateTo: { type: 'tx', transaction } });
                    }

                }
            }
        }
    } catch {
        throw Error('Failed to resolve transaction link');
    } finally {
        // Hide loader
        hideloader();
    }
}