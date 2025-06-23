import { QueryClient } from "@tanstack/react-query";
import { ResolvedJettonTxUrl } from "../url/types";
import { ToastDuration, Toaster } from "../../components/toast/ToastProvider";
import { TypedNavigation } from "../useTypedNavigation";
import { Queries } from "../../engine/queries";
import { StoredJettonWallet } from "../../engine/metadata/StoredMetadata";
import { jettonWalletAddressQueryFn, jettonWalletQueryFn } from "../../engine/hooks/jettons/jettonsBatcher";
import { Address } from "@ton/core";
import { t } from "../../i18n/t";

export async function resolveAndNavigateToJettonTransfer(
    params: {
        resolved: ResolvedJettonTxUrl,
        isTestnet: boolean,
        address: string,
        isLedger?: boolean,
        queryClient: QueryClient,
        toaster: Toaster,
        loader: { show: () => () => void },
        navigation: TypedNavigation,
        toastProps?: { duration?: ToastDuration, marginBottom?: number }
    }
) {
    const { resolved, isTestnet, address, queryClient, toaster, loader, navigation, toastProps, isLedger } = params;
    const hideloader = loader.show();

    let jettonWalletAddress = queryClient.getQueryData<StoredJettonWallet | null>(Queries.Account(address).JettonWallet())?.address;

    if (!jettonWalletAddress) {
        try {
            jettonWalletAddress = await queryClient.fetchQuery({
                queryKey: Queries.Jettons().Address(address).Wallet(resolved.jettonMaster.toString({ testOnly: isTestnet })),
                queryFn: jettonWalletAddressQueryFn(resolved.jettonMaster.toString({ testOnly: isTestnet }), address, isTestnet)
            });
        } catch {
            console.warn('Failed to fetch jetton wallet address', address, resolved.jettonMaster.toString({ testOnly: isTestnet }));
        }
    }

    if (!jettonWalletAddress) {
        toaster.show({
            message: t('transfer.wrongJettonTitle'),
            ...toastProps, type: 'error'
        });
        hideloader();
        return;
    }

    let jettonWallet = queryClient.getQueryData<StoredJettonWallet | null>(Queries.Account(jettonWalletAddress!).JettonWallet());

    if (!jettonWallet) {
        try {
            jettonWallet = await queryClient.fetchQuery({
                queryKey: Queries.Account(jettonWalletAddress!).JettonWallet(),
                queryFn: jettonWalletQueryFn(jettonWalletAddress!, isTestnet),
            });
        } catch {
            console.warn('Failed to fetch jetton wallet', jettonWalletAddress);
        }
    }

    hideloader();

    if (!jettonWallet) {
        toaster.show({
            message: t('transfer.wrongJettonMessage'),
            ...toastProps, type: 'error'
        });
        return;
    }

    const bounceable = resolved.isBounceable ?? true;

    navigation.navigateSimpleTransfer({
        target: resolved.address.toString({ testOnly: isTestnet, bounceable }),
        comment: resolved.comment,
        amount: resolved.amount,
        stateInit: null,
        asset: { type: 'jetton', master: resolved.jettonMaster, wallet: Address.parse(jettonWalletAddress) },
        callback: null,
        payload: resolved.payload,
        feeAmount: resolved.feeAmount,
        forwardAmount: resolved.forwardAmount,
        unknownDecimals: true,
        validUntil: resolved.expiresAt
    }, { ledger: isLedger });
}