import { QueryClient } from "@tanstack/react-query";
import { ToastDuration, Toaster } from "../../components/toast/ToastProvider";
import { ResolvedDomainJettonUrl, ResolvedDomainUrl, ResolvedJettonTxUrl, ResolvedTonTxUrl } from "../url/types";
import { TypedNavigation } from "../useTypedNavigation";
import { Address, Cell, TonClient4 } from "@ton/ton";
import { DNS_CATEGORY_WALLET, resolveDomain } from "../dns/dns";
import { t } from "../../i18n/t";
import { ConfigState } from "../../engine/types";
import { resolveAndNavigateToTransfer } from "./resolveAndNavigateToTransfer";
import { resolveAndNavigateToJettonTransfer } from "./resolveAndNavigateToJettonTransfer";
import { Queries } from "../../engine/queries";
import { fetchConfigQueryFn } from "../../engine/hooks/network/useConfig";

export async function resolveAndNavigateToDomainTransfer(params: {
    isTestnet: boolean,
    resolved: ResolvedDomainUrl | ResolvedDomainJettonUrl
    client: TonClient4,
    isLedger?: boolean,
    queryClient: QueryClient,
    toaster: Toaster,
    loader: { show: () => () => void },
    navigation: TypedNavigation,
    toastProps?: { duration?: ToastDuration, marginBottom?: number },
    netConfig: ConfigState | null,
    ownerAddress: string
}) {
    const { isTestnet, resolved, client, isLedger, queryClient, toaster, loader, navigation, toastProps, netConfig, ownerAddress } = params;
    const { domain } = resolved;
    const hideloader = loader.show();

    let rootDnsAddress = netConfig?.rootDnsAddress;

    if (!rootDnsAddress) {
        try {
            const config = await queryClient.fetchQuery({
                queryKey: Queries.Config(isTestnet ? 'testnet' : 'mainnet'),
                queryFn: fetchConfigQueryFn(client, isTestnet),
            });

            rootDnsAddress = config.rootDnsAddress;
        } catch {
            hideloader();
            toaster.show({
                message: 'No network config',
                ...toastProps, type: 'error'
            });
            return;
        }
    }

    if (!rootDnsAddress) {
        hideloader();
        toaster.show({
            message: 'No network config',
            ...toastProps, type: 'error'
        });
        return;
    }
    let resolvedDomainWallet: bigint | Address | Cell | null = null;
    try {
        const tonDnsRootAddress = Address.parse(rootDnsAddress);
        resolvedDomainWallet = await resolveDomain(client, tonDnsRootAddress, domain, DNS_CATEGORY_WALLET);
    } catch (error) {
        hideloader();
        toaster.show({
            message: t('transfer.error.invalidDomain'),
            ...toastProps, type: 'error'
        });
        return;
    }

    hideloader();

    if (
        !resolvedDomainWallet
        || !Address.isAddress(resolvedDomainWallet)
    ) {
        throw Error('Error resolving wallet address');
    }

    if (resolved.type === 'domain-transfer') {

        const resolvedTonTxUrl: ResolvedTonTxUrl = {
            ...resolved,
            type: 'transaction',
            address: resolvedDomainWallet,
            isBounceable: true,
        }

        resolveAndNavigateToTransfer({
            resolved: resolvedTonTxUrl,
            isTestnet,
            isLedger,
            navigation,
            domain
        });
        return;
    }

    const resolvedDomainJettonTxUrl: ResolvedJettonTxUrl = {
        ...resolved,
        type: 'jetton-transaction',
        address: resolvedDomainWallet,
        isBounceable: true
    }

    await resolveAndNavigateToJettonTransfer({
        resolved: resolvedDomainJettonTxUrl,
        isTestnet,
        address: ownerAddress,
        isLedger,
        queryClient,
        toaster,
        loader,
        navigation,
        toastProps
    });
}