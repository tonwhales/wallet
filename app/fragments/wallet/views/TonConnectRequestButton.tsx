import { memo, useCallback, useMemo } from "react";
import { useAppManifest, useConnectAppByClientSessionId, useConnectCallback, useNetwork, usePrepareConnectRequest, useTheme, useTonConnectExtensions } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { SendTransactionRequest } from "../../../engine/tonconnect/types";
import { DappRequestButton } from "./DappRequestButton";

type TonConnectRequestButtonProps = {
    request: SendTransactionRequest,
    divider?: boolean
}

export const TonConnectRequestButton = memo((props: TonConnectRequestButtonProps) => {
    const navigation = useTypedNavigation();
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
            })
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