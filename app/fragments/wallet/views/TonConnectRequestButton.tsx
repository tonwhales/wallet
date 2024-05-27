import { memo, useCallback, useMemo } from "react";
import { useAppManifest, useConnectAppByClientSessionId, useConnectCallback, usePrepareConnectRequest } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { SendTransactionRequest } from "../../../engine/tonconnect/types";
import { DappRequestButton } from "./DappRequestButton";
import { PreparedConnectRequest } from "../../../engine/hooks/dapps/usePrepareConnectRequest";
import { ToastProps, Toaster, useToaster } from "../../../components/toast/ToastProvider";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { Address } from "@ton/core";
import { getCurrentAddress } from "../../../storage/appState";
import { CHAIN } from "@tonconnect/protocol";

type TonConnectRequestButtonProps = {
    request: SendTransactionRequest,
    divider?: boolean,
    isTestnet: boolean
}

function checkNetworkAndFrom(
    params: { request: PreparedConnectRequest, isTestnet: boolean, },
    toaster: Toaster,
    toastProps: { marginBottom: number },
    connectCallback: () => void
) {
    const { request, isTestnet } = params;
    const toasterErrorProps: { type: 'error', marginBottom: number } = { type: 'error', marginBottom: toastProps.marginBottom };

    console.log({
        network: request.network,
        from: request.from,
    });

    if (!!request.network) {
        const walletNetwork = isTestnet ? CHAIN.TESTNET : CHAIN.MAINNET;
        if (request.network !== walletNetwork) {
            toaster.show({
                ...toasterErrorProps,
                message: t('products.transactionRequest.wrongNetwork'),
            });

            connectCallback();
            
            return false;
        }
    }

    if (request.from) {
        const current = getCurrentAddress();
        try {
            const fromAddress = Address.parse(request.from);

            if (!fromAddress.equals(current.address)) {
                toaster.show({
                    ...toasterErrorProps,
                    message: t('products.transactionRequest.wrongFrom'),
                });

                connectCallback();

                return false;
            }

        } catch (error) {
            toaster.show({
                ...toasterErrorProps,
                message: t('products.transactionRequest.invalidFrom'),
            });

            connectCallback();

            return false;
        }
    }

    return true;
}

export const TonConnectRequestButton = memo((props: TonConnectRequestButtonProps) => {
    const navigation = useTypedNavigation();
    const toaster = useToaster();
    const bottomBarHeight = useBottomTabBarHeight();
    const appBySessionId = useConnectAppByClientSessionId();
    const prepareConnectRequest = usePrepareConnectRequest();
    const connectCallback = useConnectCallback();
    const url = appBySessionId(props.request.from).connectedApp?.manifestUrl;
    const appManifest = useAppManifest(url ?? '');

    const title = t('products.transactionRequest.title');

    const subtitle = useMemo(() => {
        return appManifest?.name ?? 'Unknown app';
    }, [appManifest]);

    const image = appManifest?.iconUrl;

    const onPress = useCallback(() => {
        const request = props.request;
        const prepared = prepareConnectRequest(request);
        if (request.method === 'sendTransaction' && prepared) {

            const isValid = checkNetworkAndFrom(
                { request: prepared, isTestnet: props.isTestnet },
                toaster,
                Platform.select({
                    ios: { marginBottom: 24 + bottomBarHeight, },
                    android: { marginBottom: 16 },
                    default: { marginBottom: 16 },
                }),
                () => connectCallback(false, null, prepared.request, prepared.sessionCrypto)
            );

            if (!isValid) {
                return;
            }

            navigation.navigateTransfer({
                text: null,
                order: {
                    type: 'order',
                    messages: prepared.messages,
                    app: (prepared.app && prepared.app) ? {
                        title: prepared.app.name,
                        domain: extractDomain(prepared.app.url),
                        url: prepared.app.url,
                    } : undefined
                },
                job: null,
                callback: (ok, result) => connectCallback(ok, result, prepared.request, prepared.sessionCrypto)
            });
        }
    }, [prepareConnectRequest, props, connectCallback]);

    return (
        <DappRequestButton
            title={title}
            subtitle={subtitle}
            onPress={onPress}
            image={image}
            divider={props.divider}
        />
    )
});