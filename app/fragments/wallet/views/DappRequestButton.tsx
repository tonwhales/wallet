import React from "react";
import { memo, useCallback, useMemo } from "react";
import { AnimatedProductButton } from "../products/AnimatedProductButton";
import { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useAppData } from "../../../engine/hooks/dapps/useAppData";
import { useAppManifest } from "../../../engine/hooks/dapps/useAppManifest";
import { AppInfo } from "../../../components/ConnectedAppButton";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useTonConnectExtensions } from "../../../engine/hooks/dapps/useTonConnectExtenstions";
import { ParsedJob } from "../../../engine/hooks/dapps/useCurrentJob";
import { SendTransactionRequest } from "../../../engine/tonconnect/types";
import { getConnectionReferences } from "../../../storage/appState";
import { useConnectAppByClientSessionId, useConnectCallback, useNetwork, usePrepareConnectRequest, useTheme } from "../../../engine/hooks";
import { t } from "../../../i18n/t";
import { View } from "react-native";
import { WImage } from "../../../components/WImage";

type DappRequestButtonProps = ({
    type: 'ton-x',
    request: ParsedJob,
} | {
    type: 'ton-connect',
    request: SendTransactionRequest,
}) & {
    divider?: boolean
}

export const DappRequestButton = memo((props: DappRequestButtonProps) => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const [inastalledConnectApps,] = useTonConnectExtensions();

    const appBySessionId = useConnectAppByClientSessionId();
    const prepareConnectRequest = usePrepareConnectRequest();
    const connectCallback = useConnectCallback();

    const url = useMemo(() => {
        if (props.type === 'ton-x') {
            const refs = getConnectionReferences();
            if (!refs) {
                return;
            }
            return refs.find((ref) => ref.key === props.request.key.toString('base64'))?.url;
        }
        return appBySessionId(props.request.from).connectedApp?.manifestUrl;
    }, [inastalledConnectApps, props, appBySessionId]);

    const appData = useAppData(url ?? '');
    const appManifest = useAppManifest(url ?? '');

    const app: AppInfo = useMemo(() => {
        if (props.type === 'ton-x') {
            return appData ? { ...appData, type: 'app-data' } : null;
        } else {
            return appManifest ? { ...appManifest, type: 'app-manifest' } : null;
        }
    }, [appData, appManifest, props.type]);

    const title = useMemo(() => {
        if (props.type !== 'ton-x') {
            return t('products.transactionRequest.title');
        }
        if (props.request.job.type === 'transaction') {
            return t('products.transactionRequest.title');
        } else {
            return t('products.signatureRequest.title');
        }
    }, [props]);

    const subtitle = useMemo(() => {
        if (app?.type === 'app-data') {
            return app.title;
        } else if (app?.type === 'app-manifest') {
            return app.name;
        } else {
            return 'Unknown app';
        }
    }, [app]);

    const image = useMemo(() => {
        if (appData?.image) {
            return appData.image.preview256;
        } else if (appManifest?.iconUrl) {
            return appManifest.iconUrl;
        }
    }, [appData, appManifest]);

    const onPress = useCallback(() => {
        if (props.type === 'ton-x') {
            if (props.request.job.type === 'transaction') {
                navigation.navigateTransfer({
                    order: {
                        type: 'order',
                        messages: [{
                            target: props.request.job.target.toString({ testOnly: isTestnet }),
                            amount: props.request.job.amount,
                            payload: props.request.job.payload,
                            stateInit: props.request.job.stateInit,
                            amountAll: false
                        }]
                    },
                    job: props.request.jobRaw,
                    text: props.request.job.text,
                    callback: null
                });
            } else {
                const connection = getConnectionReferences().find((v) => Buffer.from(v.key, 'base64').equals(props.request.key));
                if (!connection) {
                    return; // Just in case
                }
                navigation.navigateSign({
                    text: props.request.job.text,
                    textCell: props.request.job.textCell,
                    payloadCell: props.request.job.payloadCell,
                    job: props.request.jobRaw,
                    callback: null,
                    name: connection.name
                });
            }
        } else {
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
        }
    }, [prepareConnectRequest, props, connectCallback]);

    const icon = (
        <View>
            <WImage
                src={image}
                width={46}
                heigh={46}
                borderRadius={23}
            />
            <View style={{
                height: 10, width: 10,
                backgroundColor: theme.surfaceOnBg,
                borderRadius: 5,
                position: 'absolute', top: 0, right: 0,
                justifyContent: 'center', alignItems: 'center'
            }}>
                <View style={{ backgroundColor: theme.accentRed, height: 8, width: 8, borderRadius: 4 }} />
            </View>
        </View>
    )

    return (
        <>
            <AnimatedProductButton
                entering={FadeInUp}
                exiting={FadeOutDown}
                name={title ?? 'Unknown'}
                subtitle={subtitle}
                iconComponent={icon}
                value={null}
                // TODO: add onLongPress={() => {}} to remove request
                onPress={onPress}
                extension={true}
                style={{ marginVertical: 4, marginHorizontal: 10, backgroundColor: theme.surfaceOnBg }}
            />
            {props.divider && (
                <View style={{
                    height: 1,
                    marginHorizontal: 20,
                    backgroundColor: theme.divider
                }} />
            )}
        </>
    );
});