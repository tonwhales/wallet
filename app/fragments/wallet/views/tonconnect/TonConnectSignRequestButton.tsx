import { memo, useCallback, useMemo } from "react";
import { useAppManifest, useConnectAppByClientSessionId, useConnectCallback, usePrepareConnectSignRequest } from "../../../../engine/hooks";
import { useTypedNavigation } from "../../../../utils/useTypedNavigation";
import { t } from "../../../../i18n/t";
import { SignDataRawRequest } from "../../../../engine/tonconnect/types";
import { DappRequestButton } from "../DappRequestButton";
import { useToaster } from "../../../../components/toast/ToastProvider";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";

type TonConnectSignRequestButtonProps = {
    request: SignDataRawRequest,
    divider?: boolean
}

export const TonConnectSignRequestButton = memo((props: TonConnectSignRequestButtonProps) => {
    const navigation = useTypedNavigation();
    const toaster = useToaster();
    const bottomBarHeight = useBottomTabBarHeight();
    const appBySessionId = useConnectAppByClientSessionId();
    const toastProps = Platform.select({
        ios: { marginBottom: bottomBarHeight + 24 },
        android: { marginBottom: 16 },
        default: { marginBottom: 16 }
    });
    const prepareConnectRequest = usePrepareConnectSignRequest({ toaster, toastProps });
    const connectCallback = useConnectCallback();
    const url = appBySessionId(props.request.from).connectedApp?.manifestUrl;
    const appManifest = useAppManifest(url ?? '');

    const title = t('sign.title');
    const subtitle = appManifest?.name ?? 'Unknown app';
    const image = appManifest?.iconUrl;

    const onPress = useCallback(async () => {
        const request = props.request;
        const prepared = prepareConnectRequest(request);

        if (request.method === 'signData' && prepared) {
            navigation.navigateTonConnectSign({ data: prepared });
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