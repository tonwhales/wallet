import { memo, useCallback, useMemo } from "react";
import { useAppManifest, useConnectAppByClientSessionId, useConnectCallback, usePrepareConnectTxRequest } from "../../../../engine/hooks";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { t } from "../../../../i18n/t";
import { extractDomain } from "../../../../engine/utils/extractDomain";
import { SendTransactionRequest } from "../../../../engine/tonconnect/types";
import { DappRequestButton } from "../DappRequestButton";
import { ToastDuration, useToaster } from "../../../../components/toast/ToastProvider";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { Cell } from "@ton/core";
import { getLastReturnStrategy } from "../../../../engine/tonconnect/utils";

type TonConnectTxRequestButtonProps = {
    request: SendTransactionRequest,
    divider?: boolean,
    isTestnet: boolean
}

export const TonConnectTxRequestButton = memo((props: TonConnectTxRequestButtonProps) => {
    const navigation = useTypedNavigation();
    const toaster = useToaster();
    const bottomBarHeight = useBottomTabBarHeight();
    const appBySessionId = useConnectAppByClientSessionId();
    const toastProps = Platform.select({
        ios: { marginBottom: bottomBarHeight + 24 },
        android: { marginBottom: 16 },
        default: { marginBottom: 16 }
    });
    const prepareConnectRequest = usePrepareConnectTxRequest({ isTestnet: props.isTestnet, toaster, toastProps });
    const connectCallback = useConnectCallback();
    const url = appBySessionId(props.request.from).connectedApp?.manifestUrl;
    const appManifest = useAppManifest(url ?? '');

    const title = t('products.transactionRequest.title');

    const subtitle = useMemo(() => {
        return appManifest?.name ?? 'Unknown app';
    }, [appManifest]);

    const image = appManifest?.iconUrl;

    const onPress = useCallback(async () => {
        const request = props.request;
        const prepared = prepareConnectRequest(request);

        if (request.method === 'sendTransaction' && prepared) {

            // Callback to report the result of the transaction
            const resultCallback = async (
                ok: boolean,
                result: Cell | null
            ) => {
                try {
                    await connectCallback(ok, result, prepared.request, prepared.sessionCrypto);
                } catch (error) {
                    toaster.show({
                        message: !ok
                            ? t('products.transactionRequest.failedToReportCanceled')
                            : t('products.transactionRequest.failedToReport'),
                        ...toastProps,
                        type: 'error',
                        duration: ToastDuration.LONG
                    });
                }
            };

            const returnStrategy = getLastReturnStrategy();

            navigation.navigateTransfer({
                text: null,
                source: { type: 'tonconnect', returnStrategy },
                order: {
                    type: 'order',
                    messages: prepared.messages,
                    app: (prepared.app && prepared.app) ? {
                        title: prepared.app.name,
                        domain: extractDomain(prepared.app.url),
                        url: prepared.app.url,
                    } : undefined,
                    validUntil: prepared.validUntil
                },
                callback: resultCallback
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
    );
});